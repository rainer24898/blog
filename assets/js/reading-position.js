const { readingBase, readingPost, readingTitle } = document.currentScript.dataset;
const basePath = new URL(readingBase, window.location.origin).pathname;
const storageKey = `raiii:reading-position:v1:${basePath}`;

function postUrl(path) {
    if (typeof path !== "string" || !path.startsWith("/")) return null;
    const url = new URL(path, window.location.origin);
    if (url.origin !== window.location.origin || !url.pathname.startsWith(basePath)
        || url.pathname === basePath || url.search || url.hash) return null;
    return url;
}

function readPosition() {
    try {
        const record = JSON.parse(window.localStorage.getItem(storageKey));
        if (record && typeof record.title === "string" && record.title.trim()
            && typeof record.heading === "string" && Number.isFinite(record.updatedAt)) {
            const url = postUrl(record.path);
            if (!url) return null;

            // A fragment removed by a later edit falls back to the article's start.
            url.hash = record.heading ? encodeURIComponent(record.heading) : "";
            return { ...record, href: url.href };
        }
    } catch {
        // Reading still works when storage is blocked or a record is malformed.
    }
    return null;
}

function showResume(card) {
    const link = card.querySelector("[data-reading-link]");
    const title = card.querySelector("#reading-resume-title");

    function update() {
        const record = readPosition();
        card.hidden = !record;
        if (!record) return;

        link.href = record.href;
        title.textContent = record.title;
    }

    window.addEventListener("pageshow", update);
    window.addEventListener("storage", (event) => {
        if (event.key === storageKey || event.key === null) update();
    });
    update();
}

function trackArticle(content, path, title) {
    const headings = [...content.querySelectorAll("h2[id], h3[id], h4[id], h5[id], h6[id]")];
    const scrollKeys = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "]);
    let inputStart = null;
    let inputTime = 0;
    let changedAt = 0;
    let saveTimer;

    function rememberInput(event) {
        if (!event.isTrusted) return;
        inputStart ??= window.scrollY;
        inputTime = Date.now();
    }

    function savePosition() {
        window.clearTimeout(saveTimer);
        if (!changedAt) return;
        const updatedAt = changedAt;
        changedAt = 0;

        const readingLine = Math.min(180, window.innerHeight * .25);
        if (content.getBoundingClientRect().top > readingLine) return;

        let heading = "";
        for (const section of headings) {
            if (section.getBoundingClientRect().top > readingLine) break;
            heading = section.id;
        }

        const previous = readPosition();
        if (previous?.updatedAt > updatedAt
            || (previous?.path === path && previous.heading === heading && previous.title === title)) return;

        try {
            window.localStorage.setItem(storageKey, JSON.stringify({ path, title, heading, updatedAt }));
        } catch {
            // Leave the reader's session usable with storage disabled or full.
        }
    }

    window.addEventListener("wheel", (event) => {
        if (!event.ctrlKey && event.deltaY) rememberInput(event);
    }, { passive: true });
    window.addEventListener("touchmove", rememberInput, { passive: true });
    window.addEventListener("keydown", (event) => {
        const control = event.target instanceof Element
            && event.target.closest("button, input, textarea, select, summary, [contenteditable]");
        if (!event.defaultPrevented && !control && scrollKeys.has(event.key)) rememberInput(event);
    });
    document.addEventListener("click", (event) => {
        if (event.button || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
        const link = event.target instanceof Element && event.target.closest(".toc-nav a[href^='#']");
        if (link) rememberInput(event);
    }, { capture: true });
    window.addEventListener("scroll", () => {
        const now = Date.now();
        const minimumTravel = Math.min(120, window.innerHeight * .25);
        if (inputStart === null || now - inputTime > 2000 || Math.abs(window.scrollY - inputStart) < minimumTravel) return;
        changedAt = now;
        window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(savePosition, 250);
    }, { passive: true });

    function finishVisit() {
        savePosition();
        inputStart = null;
        inputTime = 0;
    }

    window.addEventListener("pagehide", finishVisit);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") finishVisit();
    });
}

const resume = document.querySelector("[data-reading-resume]");
if (resume) showResume(resume);

const content = document.querySelector(".main-article .article-content");
const url = postUrl(readingPost);
if (content && url && readingTitle?.trim()) trackArticle(content, url.pathname, readingTitle);
