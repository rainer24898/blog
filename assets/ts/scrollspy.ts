export function setupScrollspy() {
    const toc = document.getElementById("TableOfContents");
    const content = document.querySelector(".article-content");
    if (!toc || !content) return;

    const sections = Array.from(toc.querySelectorAll<HTMLAnchorElement>("a[href^='#']")).flatMap((link) => {
        const heading = document.getElementById(link.getAttribute("href")?.slice(1) ?? "");
        const item = link.closest("li");
        return heading && item ? [{ heading, item, link, offset: 0 }] : [];
    });
    if (!sections.length) return;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let active: typeof sections[number] | undefined;
    let pendingFrame = 0;

    function highlightSection() {
        pendingFrame = 0;
        const position = window.scrollY + 20;
        let next: typeof active;
        for (const section of sections) {
            if (section.offset > position) break;
            next = section;
        }
        if (active === next) return;

        active?.item.classList.remove("active-class");
        active?.link.removeAttribute("aria-current");
        active = next;
        if (!active) return;

        active.item.classList.add("active-class");
        active.link.setAttribute("aria-current", "location");
        if (toc.matches(":hover, :focus-within")) return;

        const linkRect = active.link.getBoundingClientRect();
        const tocRect = toc.getBoundingClientRect();
        if (linkRect.top >= tocRect.top && linkRect.bottom <= tocRect.bottom) return;

        toc.scrollTo({
            top: toc.scrollTop + linkRect.top - tocRect.top - (toc.clientHeight - linkRect.height) / 2,
            behavior: reducedMotion.matches ? "auto" : "smooth",
        });
    }

    function measureSections() {
        for (const section of sections) {
            section.offset = window.scrollY + section.heading.getBoundingClientRect().top;
        }
        sections.sort((a, b) => a.offset - b.offset);
        if (!pendingFrame) pendingFrame = requestAnimationFrame(highlightSection);
    }

    window.addEventListener("scroll", () => {
        if (!pendingFrame) pendingFrame = requestAnimationFrame(highlightSection);
    }, { passive: true });
    window.addEventListener("resize", measureSections);
    if (typeof ResizeObserver === "function") new ResizeObserver(measureSections).observe(content);
    measureSections();
}
