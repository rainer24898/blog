const post = document.querySelector(".main-article");
const title = post.querySelector("h1");
const progress = document.querySelector(".article-reading-progress");
const backToTop = document.querySelector(".article-back-to-top");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let scheduled = false;

function updateReadingControls() {
    scheduled = false;
    const { top, height } = post.getBoundingClientRect();
    // The article reaches 100% when its bottom enters the viewport.
    const travel = height - window.innerHeight;
    const distanceRead = Math.max(0, -top);

    progress.hidden = travel <= 0;
    if (travel > 0) {
        progress.value = Math.round(Math.min(1, distanceRead / travel) * 100);
    }

    const returnThreshold = Math.min(window.innerHeight, 720);
    backToTop.hidden = distanceRead < returnThreshold && document.activeElement !== backToTop;
}

function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(updateReadingControls);
}

backToTop.addEventListener("click", () => {
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
    title.scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth" });
});
backToTop.addEventListener("blur", scheduleUpdate);
window.addEventListener("scroll", scheduleUpdate, { passive: true });
window.addEventListener("resize", scheduleUpdate);
window.addEventListener("pageshow", scheduleUpdate);

if (typeof ResizeObserver === "function") {
    new ResizeObserver(scheduleUpdate).observe(post, { box: "border-box" });
}

scheduleUpdate();
