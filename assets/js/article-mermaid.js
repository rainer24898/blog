import { getMermaidScheme, renderBlogMermaid } from "./mermaid-runtime.js";
import { createMermaidViewer } from "./mermaid-viewer.js";

const loader = document.querySelector("[data-article-mermaid]");
const dialog = document.querySelector("[data-mermaid-viewer]");
const viewer = dialog ? createMermaidViewer(dialog) : null;
const diagrams = new Map();

for (const figure of document.querySelectorAll("[data-blog-mermaid]")) {
    const content = figure.querySelector("[data-mermaid-content]");
    const original = content.querySelector("pre");
    const status = figure.querySelector("[data-mermaid-status]");
    const button = figure.querySelector("[data-mermaid-expand]");
    const item = { content, original, source: original.textContent, status, button, renders: new Map(), started: false };
    diagrams.set(figure, item);
    button.addEventListener("click", () => {
        const svg = content.querySelector("svg");
        if (svg) viewer?.open(svg, button);
    });
}

async function showDiagram(item, scheme = getMermaidScheme()) {
    item.started = true;
    let result = item.renders.get(scheme);
    if (!result) {
        item.status.textContent = "Đang vẽ sơ đồ…";
        item.status.hidden = false;
        result = renderBlogMermaid(item.source, { libraryUrl: loader.dataset.mermaidLibrary, scheme });
        item.renders.set(scheme, result);
    }

    try {
        const markup = await result;
        if (scheme !== getMermaidScheme()) return;
        item.content.innerHTML = markup;
        item.status.hidden = true;
        item.button.hidden = !viewer;
    } catch {
        item.renders.delete(scheme);
        if (scheme !== getMermaidScheme()) return;
        item.content.replaceChildren(item.original);
        item.status.textContent = "Không hiển thị được sơ đồ. Mã Mermaid nằm phía trên.";
        item.status.hidden = false;
        item.button.hidden = true;
    }
}

if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            observer.unobserve(entry.target);
            showDiagram(diagrams.get(entry.target));
        }
    }, { rootMargin: "480px 0px" });
    for (const figure of diagrams.keys()) observer.observe(figure);
} else {
    for (const item of diagrams.values()) showDiagram(item);
}

window.addEventListener("onColorSchemeChange", () => {
    const scheme = getMermaidScheme();
    for (const item of diagrams.values()) {
        if (item.started) showDiagram(item, scheme);
    }
});
