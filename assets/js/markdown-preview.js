import MarkdownIt from "markdown-it";
import { katex } from "@mdit/plugin-katex";

const markdown = new MarkdownIt({ html: false, linkify: true }).use(katex, {
    delimiters: "all",
    mathFence: true,
    throwOnError: false,
    trust: false,
    maxExpand: 500,
    maxSize: 20,
});

const approvedImages = new Set();
const escape = markdown.utils.escapeHtml;

function previewImageUrl(source) {
    if (!source) return "";
    try {
        const url = new URL(source, new URL("../", window.location.href));
        if (url.protocol === "https:" || url.protocol === "http:") return url.href;
    } catch {
        // Invalid Markdown image destinations remain text in the preview.
    }
    return "";
}

markdown.renderer.rules.image = (tokens, index, options, env, renderer) => {
    const token = tokens[index];
    const alt = escape(renderer.renderInlineAsText(token.children, options, env));
    const title = escape(token.attrGet("title") ?? "");
    const address = previewImageUrl(token.attrGet("src"));
    if (!address) return alt;
    const url = escape(address);

    if (approvedImages.has(address)) {
        return '<img src="' + url + '" alt="' + alt +
            '" title="' + title + '" referrerpolicy="no-referrer" decoding="async">';
    }
    return '<button type="button" class="editor-preview-image" data-preview-image="' + url +
        '" data-alt="' + alt + '" data-title="' + title + '">Xem ảnh' +
        (alt ? " · " + alt : "") + "</button>";
};

markdown.renderer.rules.link_open = (tokens, index, options, env, renderer) => {
    const token = tokens[index];
    token.attrSet("target", "_blank");
    token.attrSet("rel", "noopener noreferrer");
    return renderer.renderToken(tokens, index, options);
};

markdown.renderer.rules.table_open = () =>
    '<div class="editor-table-scroll" role="group" aria-label="Bảng có thể cuộn ngang" tabindex="0"><table>\n';
markdown.renderer.rules.table_close = () => "</table></div>\n";

export function renderMarkdown(source) {
    return markdown.render(source);
}

export function enablePreviewImages(preview) {
    preview.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-preview-image]");
        if (!button || !preview.contains(button)) return;
        const url = previewImageUrl(button.dataset.previewImage);
        if (!url) return;

        approvedImages.add(url);
        const image = document.createElement("img");
        image.alt = button.dataset.alt;
        image.title = button.dataset.title;
        image.referrerPolicy = "no-referrer";
        image.decoding = "async";
        image.src = url;
        button.replaceWith(image);
    });
}
