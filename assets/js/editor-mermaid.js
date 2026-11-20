import { renderBlogMermaid, getMermaidScheme } from "./mermaid-runtime.js";

const sourceSelector = "pre[data-editor-mermaid]";
const waitForTyping = 220;

export function createEditorMermaid(preview) {
    const libraryUrl = preview.dataset.mermaidLibrary;
    const diagrams = [];
    const views = new WeakMap();
    let pending;
    let generation = 0;
    let visible = false;
    let rendering = Promise.resolve();

    function show(block, result) {
        let view = views.get(block);
        if (view?.result === result) return;
        if (!view) {
            view = { node: document.createElement("div") };
            views.set(block, view);
            block.after(view.node);
        }
        view.result = result;
        block.hidden = Boolean(result.svg);
        if (result.svg) {
            view.node.className = "blog-mermaid-scroll";
            view.node.tabIndex = 0;
            view.node.setAttribute("role", "group");
            view.node.setAttribute("aria-label", "Sơ đồ Mermaid");
            view.node.innerHTML = result.svg;
        } else {
            view.node.className = "blog-mermaid-status";
            view.node.removeAttribute("tabindex");
            view.node.removeAttribute("role");
            view.node.removeAttribute("aria-label");
            view.node.textContent = "Không dựng được sơ đồ Mermaid. Kiểm tra cú pháp hoặc tải lại trang.";
        }
    }

    async function renderBlocks(work, scheme, version) {
        for (const { block, diagram, index } of work) {
            if (version !== generation || !preview.contains(block)) return;
            let result = diagram.results.get(scheme);
            if (!result) {
                try {
                    const svg = await renderBlogMermaid(diagram.source, { libraryUrl, scheme, untrusted: true });
                    result = { svg };
                } catch {
                    result = {};
                }
                // A Markdown edit outside the diagram can replace its DOM while rendering.
                if (diagrams[index] === diagram) diagram.results.set(scheme, result);
            }
            if (version === generation && preview.contains(block)) show(block, result);
        }
    }

    function refresh() {
        const version = ++generation;
        window.clearTimeout(pending);
        const blocks = [...preview.querySelectorAll(sourceSelector)];
        diagrams.length = blocks.length;
        visible = blocks.length > 0 && preview.getClientRects().length > 0;
        if (!visible || !libraryUrl) return;

        const scheme = getMermaidScheme();
        const work = [];
        blocks.forEach((block, index) => {
            const source = block.querySelector("code")?.textContent;
            if (!source?.trim()) return;
            if (diagrams[index]?.source !== source) {
                diagrams[index] = { source, results: new Map() };
            }
            const diagram = diagrams[index];
            const cached = diagram.results.get(scheme);
            if (cached) show(block, cached);
            else work.push({ block, diagram, index });
        });
        if (work.length) {
            pending = window.setTimeout(() => {
                const render = () => renderBlocks(work, scheme, version);
                rendering = rendering.then(render, render);
            }, waitForTyping);
        }
    }

    new MutationObserver(refresh).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-scheme"],
    });
    const visibilityChanged = () => {
        if (visible !== (Boolean(preview.querySelector(sourceSelector)) && preview.getClientRects().length > 0)) {
            refresh();
        }
    };
    if (typeof ResizeObserver === "function") {
        new ResizeObserver(visibilityChanged).observe(preview);
    } else {
        window.addEventListener("resize", visibilityChanged);
    }
    return refresh;
}
