import { strToU8, zipSync } from "fflate";

const databaseName = "raiii-editor-images";
const imageStore = "images";
const maxImageSize = 10 * 1024 * 1024;
const maxBundleSize = 50 * 1024 * 1024;
const managedImage = /^images\/raiii-[0-9a-f]{32}\.(?:jpg|png|webp|gif)$/;
let databasePromise;

export function editorImagePath(value) {
    const path = typeof value === "string" ? value.replace(/^\.\//, "") : "";
    return managedImage.test(path) ? path : null;
}

function openDatabase() {
    if (!databasePromise) {
        databasePromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(databaseName, 1);
            let blocked = false;

            request.onupgradeneeded = () => request.result.createObjectStore(imageStore);
            request.onerror = () => reject(request.error);
            request.onblocked = () => {
                blocked = true;
                reject(new Error("Kho ảnh đang bận."));
            };
            request.onsuccess = () => {
                const database = request.result;
                if (blocked) {
                    database.close();
                    return;
                }
                database.onversionchange = () => {
                    database.close();
                    databasePromise = undefined;
                };
                resolve(database);
            };
        }).catch((error) => {
            databasePromise = undefined;
            throw new Error("Không mở được kho ảnh trên trình duyệt này.", { cause: error });
        });
    }
    return databasePromise;
}

async function queryImage(mode, query) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(imageStore, mode);
        const request = query(transaction.objectStore(imageStore));
        transaction.oncomplete = () => resolve(request.result);
        transaction.onabort = () => {
            const error = transaction.error;
            const message = error?.name === "QuotaExceededError"
                ? "Bộ nhớ trình duyệt đã đầy. Hãy dùng ảnh nhỏ hơn hoặc dùng URL ảnh."
                : "Không đọc hoặc lưu được ảnh trong trình duyệt.";
            reject(new Error(message, { cause: error }));
        };
    });
}

function rasterFormat(bytes) {
    const ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end));
    const png = [137, 80, 78, 71, 13, 10, 26, 10];
    if (png.every((byte, i) => bytes[i] === byte)) return ["png", "image/png"];
    if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return ["jpg", "image/jpeg"];
    if (["GIF87a", "GIF89a"].includes(ascii(0, 6))) return ["gif", "image/gif"];
    if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return ["webp", "image/webp"];
    throw new Error("Chọn tệp ảnh JPEG, PNG, WebP hoặc GIF hợp lệ.");
}

async function verifyImage(blob) {
    const url = URL.createObjectURL(blob);
    try {
        const image = new Image();
        image.src = url;
        await image.decode();
    } catch (error) {
        throw new Error("Không mở được ảnh. Hãy kiểm tra tệp và thử lại.", { cause: error });
    } finally {
        URL.revokeObjectURL(url);
    }
}

export async function storeEditorImage(file) {
    if (!file || file.size === 0) throw new Error("Hãy chọn tệp ảnh.");
    if (file.size > maxImageSize) throw new Error("Mỗi ảnh từ thiết bị có giới hạn 10 MiB.");

    const [extension, mimeType] = rasterFormat(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
    const blob = file.slice(0, file.size, mimeType);
    await verifyImage(blob);

    const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
        byte.toString(16).padStart(2, "0")
    ).join("");
    const path = "images/raiii-" + id + "." + extension;
    await queryImage("readwrite", (store) => store.add(blob, path));
    return { path, blob };
}

export async function loadEditorImage(path) {
    const key = editorImagePath(path);
    if (!key) return null;
    return await queryImage("readonly", (store) => store.get(key)) ?? null;
}

function bundleFolder(filename, slug) {
    const stem = (filename ?? "").replace(/\.(?:md|markdown)$/i, "");
    if (/^\d{4}-\d{2}-\d{2}-[a-z0-9][a-z0-9_-]{0,110}$/i.test(stem)) return stem;
    const safeSlug = (slug ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "-")
        .replace(/^-+|-+$/g, "").slice(0, 100);
    return safeSlug || "bai-viet";
}

export async function exportEditorBundle({ filename, slug, markdown, paths }) {
    const imagePaths = [...new Set(paths.map(editorImagePath).filter(Boolean))];
    if (!imagePaths.length) throw new Error("Bài viết chưa có ảnh từ thiết bị.");
    const images = await Promise.all(imagePaths.map(loadEditorImage));
    if (images.some((image) => !image)) {
        throw new Error("Một số ảnh không còn trong trình duyệt. Hãy chèn lại ảnh trước khi xuất gói.");
    }
    if (images.reduce((size, image) => size + image.size, 0) > maxBundleSize) {
        throw new Error("Tổng dung lượng ảnh vượt 50 MiB. Hãy dùng ảnh nhỏ hơn hoặc dùng URL ảnh.");
    }

    const folder = bundleFolder(filename, slug);
    const archive = { [folder + "/index.md"]: strToU8(markdown) };
    for (const [index, path] of imagePaths.entries()) {
        archive[folder + "/" + path] = new Uint8Array(await images[index].arrayBuffer());
    }

    // Images are already compressed. Storing the bytes avoids recompressing them in the UI thread.
    const bytes = zipSync(archive, { level: 0 });
    return { blob: new Blob([bytes], { type: "application/zip" }), filename: folder + ".zip" };
}
