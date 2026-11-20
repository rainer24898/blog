export function createMermaidViewer(dialog) {
    if (typeof dialog.showModal !== "function") return null;

    const viewport = dialog.querySelector(".mermaid-viewer-scroll");
    const canvas = dialog.querySelector(".mermaid-viewer-canvas");
    const zoomIn = dialog.querySelector('[data-zoom="in"]');
    const zoomOut = dialog.querySelector('[data-zoom="out"]');
    let diagram;
    let trigger;
    let focusFallback;
    let naturalWidth;
    let naturalHeight;
    let scale;
    let minimumScale;
    let fitMode;
    let drag;

    function applyScale(next, keepCenter = false) {
        const bounds = viewport.getBoundingClientRect();
        const centerX = bounds.left + viewport.clientWidth / 2;
        const centerY = bounds.top + viewport.clientHeight / 2;
        const before = diagram.getBoundingClientRect();

        scale = next;
        diagram.style.width = `${Math.max(1, naturalWidth * scale)}px`;
        diagram.style.height = `${Math.max(1, naturalHeight * scale)}px`;
        zoomIn.disabled = scale >= 10;
        zoomOut.disabled = scale <= minimumScale;

        if (keepCenter) {
            const after = diagram.getBoundingClientRect();
            const pointX = (centerX - before.left) / before.width;
            const pointY = (centerY - before.top) / before.height;
            viewport.scrollLeft += after.left + pointX * after.width - centerX;
            viewport.scrollTop += after.top + pointY * after.height - centerY;
        } else {
            viewport.scrollTo(0, 0);
        }

        viewport.toggleAttribute("data-pannable",
            viewport.scrollWidth > viewport.clientWidth || viewport.scrollHeight > viewport.clientHeight);
    }

    function fit(opening = false) {
        const style = getComputedStyle(viewport);
        const width = Math.max(1, viewport.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
        const height = Math.max(1, viewport.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom));
        const fittedScale = Math.min(width / naturalWidth, height / naturalHeight, 1);
        const next = opening ? Math.max(.85, fittedScale) : fittedScale;
        minimumScale = Math.min(.05, fittedScale);
        fitMode = next === fittedScale;
        applyScale(next);
    }

    dialog.querySelector('[data-zoom="fit"]').addEventListener("click", () => fit());
    dialog.querySelector('[data-zoom="actual"]').addEventListener("click", () => {
        fitMode = false;
        applyScale(1, true);
    });
    zoomIn.addEventListener("click", () => {
        fitMode = false;
        applyScale(Math.min(10, scale * 1.3), true);
    });
    zoomOut.addEventListener("click", () => {
        fitMode = false;
        applyScale(Math.max(minimumScale, scale / 1.3), true);
    });

    viewport.addEventListener("pointerdown", (event) => {
        if (event.pointerType !== "mouse" || event.button !== 0 || !viewport.hasAttribute("data-pannable")
            || !canvas.contains(event.target) || event.target.closest("a")) return;

        drag = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            left: viewport.scrollLeft,
            top: viewport.scrollTop,
        };
        event.preventDefault();
        viewport.setPointerCapture(event.pointerId);
        viewport.classList.add("is-dragging");
    });
    viewport.addEventListener("pointermove", (event) => {
        if (drag?.pointerId !== event.pointerId) return;
        viewport.scrollLeft = drag.left + drag.x - event.clientX;
        viewport.scrollTop = drag.top + drag.y - event.clientY;
    });
    viewport.addEventListener("lostpointercapture", () => {
        drag = null;
        viewport.classList.remove("is-dragging");
    });

    new ResizeObserver(() => {
        if (dialog.open && fitMode) fit();
    }).observe(viewport, { box: "border-box" });

    dialog.addEventListener("close", () => {
        if (dialog.open) return;
        canvas.replaceChildren();
        diagram = null;
        drag = null;
        viewport.classList.remove("is-dragging");
        trigger?.focus({ preventScroll: true });
        if (document.activeElement !== trigger) focusFallback?.focus({ preventScroll: true });
        trigger = null;
        focusFallback = null;
    });

    return {
        open(svgElement, triggerElement) {
            if (dialog.open) return;
            const viewBox = svgElement.viewBox.baseVal;
            const bounds = svgElement.getBoundingClientRect();
            naturalWidth = viewBox.width || Math.max(1, bounds.width);
            naturalHeight = viewBox.height || Math.max(1, bounds.height);
            diagram = svgElement.cloneNode(true);
            trigger = triggerElement;
            focusFallback = svgElement.parentElement;
            canvas.replaceChildren(diagram);
            dialog.showModal();
            fit(true);
        },
    };
}
