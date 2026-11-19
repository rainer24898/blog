export function setupSmoothAnchors() {
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

    document.addEventListener("click", (event) => {
        if (reducedMotion.matches || event.defaultPrevented || event.button !== 0
            || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const link = event.target instanceof Element
            ? event.target.closest<HTMLAnchorElement>("a[href^='#']")
            : null;
        if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;

        const fragment = link.hash;
        let id = fragment.slice(1);
        try {
            id = decodeURIComponent(id);
        } catch {
            // Malformed escapes can still be part of a literal ID.
        }
        const target = document.getElementById(id);
        if (!target) return;

        event.preventDefault();
        if (location.hash !== link.hash) history.pushState(null, "", fragment);
        window.scrollTo({ top: window.scrollY + target.getBoundingClientRect().top, behavior: "smooth" });
    });
}
