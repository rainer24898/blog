import { parseDocument } from "yaml";
import { renderMarkdown, enablePreviewImages } from "./markdown-preview.js";

const storagePrefix = "raiii-editor:v1:draft:";
const selectionKey = "raiii-editor:v1:selected";
const importLimit = 2 * 1024 * 1024;
const titleFallback = "Bài viết chưa đặt tên";
const unsafeKeys = new Set(["__proto__", "constructor", "prototype"]);
const localDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

const root = document.querySelector("[data-blog-editor]");
if (root) startEditor(root);

function dateForInput(value) {
    if (typeof value !== "string" || !value) return "";
    const isoDate = /^(\d{4}-\d{2}-\d{2})(?:$|T| )/.exec(value)?.[1];
    if (isoDate && !Number.isNaN(Date.parse(isoDate))) return isoDate;

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "" : localDate.format(parsed);
}

function createDraft(data = {}) {
    return {
        id: globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2),
        updatedAt: Date.now(),
        body: "",
        title: "",
        description: "",
        categories: "",
        tags: "",
        date: localDate.format(new Date()),
        isDraft: false,
        filename: "",
        frontMatter: {},
        ...data,
    };
}

function decodeDraft(raw, id) {
    try {
        const draft = JSON.parse(raw);
        if (draft?.id !== id || !id || typeof draft.body !== "string") return null;
        const strings = ["title", "description", "categories", "tags", "date", "filename"];
        return {
            ...draft,
            ...Object.fromEntries(strings.map((name) => [name, typeof draft[name] === "string" ? draft[name] : ""])),
            isDraft: draft.isDraft === true,
            updatedAt: Number.isFinite(draft.updatedAt) ? draft.updatedAt : 0,
            frontMatter: normalizeMetadata(draft.frontMatter ?? {}),
        };
    } catch {
        return null;
    }
}

function normalizeMetadata(value) {
    function normalize(node, depth = 0) {
        if (depth > 32) throw new Error("Phần thông tin bài viết có quá nhiều cấp lồng nhau.");
        if (node === null || typeof node === "boolean" || typeof node === "string" || Number.isFinite(node)) {
            return node;
        }
        if (Array.isArray(node)) return node.map((item) => normalize(item, depth + 1));

        if (node instanceof Map || (node && Object.getPrototypeOf(node) === Object.prototype)) {
            const entries = node instanceof Map ? [...node] : Object.entries(node);
            return Object.fromEntries(entries.map(([key, item]) => {
                if (typeof key !== "string" || unsafeKeys.has(key)) {
                    throw new Error("Phần thông tin bài viết có tên trường không hợp lệ.");
                }
                return [key, normalize(item, depth + 1)];
            }));
        }

        throw new Error("Phần thông tin bài viết chứa giá trị không hỗ trợ.");
    }

    const result = normalize(value);
    if (result === null || typeof result !== "object" || Array.isArray(result)) {
        throw new Error("Phần thông tin bài viết phải có các cặp tên và giá trị.");
    }
    return result;
}

function readJsonHeader(source) {
    let depth = 0;
    let quoted = false;
    let escaped = false;

    for (let index = 0; index < source.length; index++) {
        const character = source[index];
        if (escaped) {
            escaped = false;
        } else if (quoted && character === "\\") {
            escaped = true;
        } else if (character === '"') {
            quoted = !quoted;
        } else if (!quoted && character === "{") {
            depth++;
        } else if (!quoted && character === "}" && --depth === 0) {
            return [JSON.parse(source.slice(0, index + 1)), source.slice(index + 1)];
        }
    }

    throw new Error("Không đọc được front matter JSON.");
}

function labelText(value) {
    if (Array.isArray(value)) return value.filter((label) => typeof label === "string").join(", ");
    return typeof value === "string" ? value : "";
}

function readMarkdown(source, filename) {
    let body = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
    let header = {};
    const start = body.trimStart();

    if (/^---[ \t]*\n/.test(start)) {
        const firstLineEnd = start.indexOf("\n") + 1;
        const rest = start.slice(firstLineEnd);
        const end = /^(?:---|\.\.\.)[ \t]*(?:\n|$)/m.exec(rest);

        if (end) {
            try {
                const yaml = parseDocument(rest.slice(0, end.index), { schema: "core" });
                if (yaml.errors.length) throw yaml.errors[0];
                header = yaml.toJS({ mapAsMap: true, maxAliasCount: 0 }) ?? {};
            } catch {
                throw new Error("Không đọc được front matter YAML. Kiểm tra cú pháp và bỏ bí danh YAML nếu có.");
            }
            body = rest.slice(end.index + end[0].length).replace(/^\n/, "");
        }
    } else if (/^\{\s*(?:"|\})/.test(start)) {
        try {
            [header, body] = readJsonHeader(start);
            body = body.replace(/^\n{1,2}/, "");
        } catch {
            throw new Error("Không đọc được front matter JSON.");
        }
    } else if (/^\+\+\+[ \t]*\n/.test(start)) {
        throw new Error("Hãy dùng front matter YAML hoặc JSON cho tệp Markdown.");
    }

    const frontMatter = normalizeMetadata(header);
    const markdownTitle = /^#\s+(.+?)\s*#*\s*$/m.exec(body)?.[1] ?? "";
    const fileTitle = filename.replace(/\.(md|markdown)$/i, "").replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/[-_]+/g, " ");
    return createDraft({
        body,
        title: typeof frontMatter.title === "string" ? frontMatter.title : markdownTitle || fileTitle,
        description: typeof frontMatter.description === "string" ? frontMatter.description : "",
        categories: labelText(frontMatter.categories),
        tags: labelText(frontMatter.tags),
        date: dateForInput(frontMatter.date) || localDate.format(new Date()),
        isDraft: frontMatter.draft === true,
        filename,
        frontMatter,
    });
}

function toSlug(title, id) {
    return title.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-").slice(0, 100).replace(/^-|-$/g, "") || "bai-viet-" + id.slice(0, 8);
}

function fileInfo(draft) {
    const date = dateForInput(draft.date) || localDate.format(new Date());
    const slug = toSlug(draft.title.trim(), draft.id);
    const original = draft.filename;
    const validOriginal = original.length <= 180 && /^[^/\\:*?"<>|\u0000-\u001f]+\.(md|markdown)$/i.test(original);
    const filename = validOriginal ? original : date + "-" + slug + ".md";
    return { filename, date, slug };
}

function taxonomyLabels(value, original) {
    if (value === labelText(original) && Array.isArray(original)) return original;
    return [...new Set(value.split(",").map((label) => label.trim()).filter(Boolean))];
}

function exportMarkdown(draft) {
    const { date, slug } = fileInfo(draft);
    const original = draft.frontMatter;
    const header = {
        ...original,
        title: draft.title.trim() || titleFallback,
        date: dateForInput(original.date) === date ? original.date : date,
        draft: draft.isDraft,
    };
    if (!draft.filename) header.slug = slug;

    if (draft.description.trim()) header.description = draft.description.trim();
    else delete header.description;

    for (const taxonomy of ["categories", "tags"]) {
        const labels = taxonomyLabels(draft[taxonomy], original[taxonomy]);
        if (labels.length) header[taxonomy] = labels;
        else delete header[taxonomy];
    }
    if (!Object.hasOwn(header, "math") && /\\\(|\\\[|\$\$|(?:^|[^\\])\$[^\s$\n][^$\n]*\$/.test(draft.body)) {
        header.math = true;
    }

    return JSON.stringify(header, null, 2) + "\n\n" + draft.body;
}

function insertMarkdown(action, selected) {
    switch (action) {
        case "heading": return "\n\n## " + (selected || "Tiêu đề mục") + "\n\n";
        case "bold": return "**" + (selected || "chữ đậm") + "**";
        case "italic": return "*" + (selected || "chữ nghiêng") + "*";
        case "link": return "[" + (selected || "Tên liên kết") + "](https://example.com)";
        case "list": return "\n\n" + (selected || "Mục danh sách").split("\n").map((line) => "- " + line).join("\n") + "\n\n";
        case "quote": return "\n\n" + (selected || "Trích dẫn").split("\n").map((line) => "> " + line).join("\n") + "\n\n";
        case "code": {
            const tick = String.fromCharCode(96);
            const longest = Array.from(selected.matchAll(/(\x60+)/g)).reduce((count, match) => Math.max(count, match[0].length), 2);
            const fence = tick.repeat(longest + 1);
            return "\n\n" + fence + "text\n" + (selected || "Mã nguồn") + "\n" + fence + "\n\n";
        }
        case "table": return "\n\n| Cột 1 | Cột 2 |\n| --- | --- |\n| " + (selected || "Giá trị") + " | Giá trị |\n\n";
        case "math": return "\n\n$$\n" + (selected || "\\mathbf{y} = \\mathbf{H}\\mathbf{x} + \\mathbf{n}") + "\n$$\n\n";
        default: return selected;
    }
}

async function copy(value) {
    try {
        await navigator.clipboard.writeText(value);
        return true;
    } catch {
        const field = document.createElement("textarea");
        const focus = document.activeElement;
        field.value = value;
        field.readOnly = true;
        field.style.cssText = "position:fixed;inline-size:1px;block-size:1px;opacity:0;inset-block-start:0;";
        document.body.append(field);
        field.select();
        try {
            return Boolean(document.execCommand("copy"));
        } catch {
            return false;
        } finally {
            field.remove();
            focus?.focus({ preventScroll: true });
        }
    }
}

function startEditor(editor) {
    const find = (name) => editor.querySelector("[data-" + name + "]");
    const list = find("draft-list");
    const body = find("editor-body");
    const preview = find("editor-preview");
    const previewTitle = find("editor-preview-title");
    const status = find("editor-status");
    const count = find("editor-count");
    const importer = find("editor-import");
    const amendDraftStatus = find("editor-is-draft");
    const modes = [...editor.querySelectorAll("[data-editor-mode]")];
    const inputs = Object.fromEntries(["title", "description", "categories", "tags", "date"].flatMap((key) => {
        const field = find("editor-" + key);
        return field ? [[key, field]] : [];
    }));
    const drafts = new Map();
    let storage;
    let selectedId;
    let active;
    let previewTimer;
    let saveTimer;
    let renderedBody;

    try {
        storage = window.localStorage;
        selectedId = storage.getItem(selectionKey);
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (!key?.startsWith(storagePrefix)) continue;
            const id = key.slice(storagePrefix.length);
            const snapshot = storage.getItem(key);
            const value = decodeDraft(snapshot, id);
            if (value) drafts.set(id, { value, snapshot });
        }
    } catch {
        storage = undefined;
    }

    function announce(message, state = "saved") {
        status.textContent = message;
        status.dataset.state = state;
    }

    function updatePreview() {
        clearTimeout(previewTimer);
        if (previewTitle) previewTitle.textContent = active.value.title.trim() || titleFallback;
        if (renderedBody === active.value.body) return;

        renderedBody = active.value.body;
        if (renderedBody.trim()) {
            try {
                preview.innerHTML = renderMarkdown(renderedBody);
            } catch {
                preview.textContent = "Không hiển thị được bản xem trước cho nội dung này.";
            }
        } else {
            const empty = document.createElement("p");
            empty.className = "editor-preview-empty";
            empty.textContent = "Nội dung Markdown sẽ xuất hiện ở đây.";
            preview.replaceChildren(empty);
        }
        if (count) {
            const words = renderedBody.trim().match(/\S+/g)?.length ?? 0;
            count.textContent = words.toLocaleString("vi-VN") + " từ";
        }
    }

    function showFileName() {
        const target = find("editor-filename");
        if (target) target.textContent = fileInfo(active.value).filename;
    }

    function refreshList() {
        const ordered = [...drafts.values()].sort((left, right) => right.value.updatedAt - left.value.updatedAt);
        list.replaceChildren(...ordered.map(({ value }) => new Option(value.title.trim() || titleFallback, value.id)));
        list.value = active.value.id;
    }

    function rememberSelection() {
        try {
            storage?.setItem(selectionKey, active.value.id);
        } catch {
            // A draft can still be saved even if the last-selected ID cannot be written.
        }
    }

    function openDraft(record) {
        active = record;
        for (const [key, field] of Object.entries(inputs)) field.value = active.value[key];
        if (amendDraftStatus) amendDraftStatus.checked = active.value.isDraft;
        body.value = active.value.body;
        renderedBody = undefined;
        refreshList();
        showFileName();
        updatePreview();
        rememberSelection();
    }

    function makeRecord(value = createDraft()) {
        const record = { value, snapshot: null };
        drafts.set(value.id, record);
        return record;
    }

    function saveDraft() {
        clearTimeout(saveTimer);
        saveTimer = undefined;
        const draft = active.value;
        let contents = JSON.stringify(draft);
        if (contents === active.snapshot) return true;

        try {
            if (!storage) throw new Error("Storage disabled");
            const key = storagePrefix + draft.id;
            const latest = storage.getItem(key);
            if (latest !== active.snapshot) {
                const previous = decodeDraft(latest, draft.id);
                const clone = { ...draft, id: createDraft().id };
                contents = JSON.stringify(clone);
                storage.setItem(storagePrefix + clone.id, contents);
                if (previous) drafts.set(draft.id, { value: previous, snapshot: latest });
                else drafts.delete(draft.id);
                active.value = clone;
                drafts.set(clone.id, active);
                showFileName();
                rememberSelection();
                announce("Bản nháp đã đổi ở tab khác. Nội dung của tab này được lưu thành bản riêng.");
            } else {
                storage.setItem(key, contents);
                announce("Đã lưu bản nháp trên thiết bị này.");
            }
            active.snapshot = contents;
            refreshList();
            return true;
        } catch {
            announce("Chưa lưu được vào trình duyệt. Tải tệp Markdown để giữ bài viết.", "error");
            return false;
        }
    }

    function collectChanges() {
        active.value.body = body.value;
        for (const [key, field] of Object.entries(inputs)) active.value[key] = field.value;
        if (amendDraftStatus) active.value.isDraft = amendDraftStatus.checked;
        active.value.updatedAt = Date.now();
        showFileName();
        clearTimeout(previewTimer);
        clearTimeout(saveTimer);
        previewTimer = window.setTimeout(updatePreview, 140);
        saveTimer = window.setTimeout(saveDraft, 350);
    }

    function setMode(mode) {
        editor.dataset.mode = mode;
        for (const button of modes) button.setAttribute("aria-pressed", String(button.dataset.editorMode === mode));
        if (mode === "preview") updatePreview();
    }

    function downloadDraft() {
        const file = URL.createObjectURL(new Blob([exportMarkdown(active.value)], { type: "text/markdown;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = file;
        link.download = fileInfo(active.value).filename;
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(file), 1000);
        announce("Đã tạo tệp Markdown để tải xuống.");
    }

    for (const field of [...Object.values(inputs), body, amendDraftStatus].filter(Boolean)) {
        field.addEventListener("input", collectChanges);
    }
    for (const button of modes) button.addEventListener("click", () => setMode(button.dataset.editorMode));
    for (const button of editor.querySelectorAll("[data-editor-insert]")) {
        button.addEventListener("click", () => {
            const start = body.selectionStart;
            const end = body.selectionEnd;
            const selected = body.value.slice(start, end);
            body.setRangeText(insertMarkdown(button.dataset.editorInsert, selected), start, end, "select");
            body.focus();
            collectChanges();
        });
    }

    list.addEventListener("change", () => {
        const next = drafts.get(list.value);
        if (!next) return;
        const saved = saveDraft();
        openDraft(next);
        if (saved) announce("Đã mở bản nháp.");
    });

    find("draft-new").addEventListener("click", () => {
        const saved = saveDraft();
        openDraft(makeRecord());
        setMode("write");
        (inputs.title ?? body).focus();
        if (saved) announce("Đã tạo bản nháp mới.");
    });

    find("draft-delete").addEventListener("click", () => {
        const draft = active.value;
        if (!window.confirm("Xóa bản nháp “" + (draft.title.trim() || titleFallback) + "” khỏi trình duyệt?")) return;
        try {
            const key = storagePrefix + draft.id;
            if (storage && storage.getItem(key) !== active.snapshot) {
                announce("Bản nháp đã thay đổi ở tab khác. Hãy tải lại trước khi xóa.", "error");
                return;
            }
            storage?.removeItem(key);
        } catch {
            announce("Không xóa được bản nháp trong trình duyệt.", "error");
            return;
        }
        clearTimeout(saveTimer);
        drafts.delete(draft.id);
        openDraft([...drafts.values()].sort((a, b) => b.value.updatedAt - a.value.updatedAt)[0] ?? makeRecord());
        announce("Đã xóa bản nháp.");
    });

    importer.addEventListener("change", async () => {
        const file = importer.files[0];
        if (!file) return;
        importer.disabled = true;
        try {
            if (file.size > importLimit) throw new Error("Tệp Markdown cần nhỏ hơn 2 MB.");
            const incoming = readMarkdown(await file.text(), file.name);
            const previousSaved = saveDraft();
            openDraft(makeRecord(incoming));
            setMode("write");
            if (saveDraft() && previousSaved) announce("Đã nhập " + file.name + " thành bản nháp mới.");
            else announce("Đã nhập tệp. Có bản nháp chưa lưu được vào trình duyệt.", "error");
        } catch (error) {
            announce(error instanceof Error ? error.message : "Không mở được tệp Markdown.", "error");
        } finally {
            importer.value = "";
            importer.disabled = false;
        }
    });

    find("editor-download").addEventListener("click", downloadDraft);
    find("editor-copy").addEventListener("click", async () => {
        const ok = await copy(exportMarkdown(active.value));
        announce(ok ? "Đã sao chép Markdown." : "Không sao chép được. Hãy tải tệp Markdown.", ok ? "saved" : "error");
    });
    find("editor-copy-filename")?.addEventListener("click", async () => {
        const ok = await copy(fileInfo(active.value).filename);
        announce(ok ? "Đã sao chép tên tệp." : "Không sao chép được tên tệp.", ok ? "saved" : "error");
    });

    function flushPending() {
        if (saveTimer) saveDraft();
    }

    window.addEventListener("pagehide", flushPending);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") flushPending();
    });

    openDraft(drafts.get(selectedId) ?? [...drafts.values()].sort((a, b) => b.value.updatedAt - a.value.updatedAt)[0] ?? makeRecord());
    setMode("write");
    enablePreviewImages(preview);
    const workspace = find("editor-workspace");
    const loading = find("editor-loading");
    if (workspace) workspace.hidden = false;
    if (loading) loading.hidden = true;
    if (!storage) announce("Bản nháp chỉ giữ trong tab này. Tải tệp Markdown để lưu lại.", "error");
}
