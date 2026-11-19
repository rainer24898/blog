const form = document.querySelector(".blog-search-form[data-json]");
const input = form.elements.namedItem("keyword");
const category = document.querySelector("#search-category");
const status = document.querySelector(".search-status");
const results = document.querySelector("#search-results");
const retry = document.querySelector(".search-retry");
const dataRequests = new Map();

let timer;
let revision = 0;

function fold(text) {
    return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d");
}

function loadPosts(url) {
    if (dataRequests.has(url)) return dataRequests.get(url);

    const request = fetch(url)
        .then((response) => {
            if (!response.ok) throw new Error("Search index unavailable");
            return response.json();
        })
        .then((posts) => posts.map((post) => {
            const categories = post.categories ?? [];
            const body = post.content.normalize("NFC");
            return {
                ...post,
                categories,
                body,
                titleKey: fold(post.title),
                topicKey: fold([...categories, ...(post.tags ?? [])].join(" ")),
                bodyKey: fold(body),
            };
        }))
        .catch((error) => {
            dataRequests.delete(url);
            throw error;
        });

    dataRequests.set(url, request);
    return request;
}

function rank(post, phrase, terms) {
    let score = 0;
    for (const term of terms) {
        if (post.titleKey.includes(term)) score += 12;
        else if (post.topicKey.includes(term)) score += 6;
        else if (post.bodyKey.includes(term)) score += 1;
        else return 0;
    }
    if (post.titleKey === phrase) return score + 60;
    if (post.titleKey.includes(phrase)) return score + 30;
    return score;
}

function excerpt(post, terms) {
    if (post.description && terms.every((term) =>
        post.titleKey.includes(term) || post.topicKey.includes(term)
    )) return post.description;

    const matches = terms.map((term) => post.bodyKey.indexOf(term)).filter((index) => index >= 0);
    const match = matches.length ? Math.min(...matches) : 0;
    const start = Math.max(0, match - 40);
    const startSpace = post.body.indexOf(" ", start);
    const from = start > 0 && startSpace > start && startSpace < match ? startSpace + 1 : start;
    const end = Math.max(from + 145, match + Math.max(0, ...terms.map((term) => term.length)));
    const endSpace = post.body.indexOf(" ", end);
    const to = endSpace > end && endSpace - end < 24 ? endSpace : end;
    const text = post.body.slice(from, to).trim();
    return (from ? "…" : "") + text + (to < post.body.length ? "…" : "");
}

function renderResult(post, terms) {
    const article = document.createElement("article");
    const link = document.createElement("a");
    const details = document.createElement("div");
    const title = document.createElement("h2");
    const preview = document.createElement("p");

    link.href = post.permalink;
    link.setAttribute("aria-label", post.title);
    details.className = "article-details";
    title.className = "article-title";
    title.textContent = post.title;
    preview.className = "search-excerpt";
    preview.textContent = excerpt(post, terms);
    details.append(title, preview);

    if (post.categories.length) {
        const topics = document.createElement("p");
        topics.className = "search-topics";
        topics.textContent = post.categories.join(" · ");
        details.append(topics);
    }

    link.append(details);
    article.append(link);
    return article;
}

async function search(query, topic, currentRevision) {
    const phrase = fold(query).replace(/\s+/g, " ").trim();
    if (!phrase && !topic.value) return;
    const terms = phrase ? [...new Set(phrase.split(" "))] : [];
    const source = phrase ? form.dataset.json : category.dataset.catalog;
    status.textContent = "Đang tìm bài viết…";

    try {
        const posts = await loadPosts(source);
        if (currentRevision !== revision) return;

        const matches = posts
            .filter((post) => {
                if (!topic.value) return true;
                if (post.categorySlugs) return post.categorySlugs.includes(topic.value);
                return post.categories.includes(topic.textContent);
            })
            .map((post) => ({ post, score: phrase ? rank(post, phrase, terms) : 1 }))
            .filter(({ score }) => score > 0)
            .sort((first, second) => second.score - first.score);
        results.replaceChildren(...matches.map(({ post }) => renderResult(post, terms)));
        status.textContent = matches.length
            ? matches.length + " bài viết" + (topic.value ? " · " + topic.textContent : "")
            : "Không tìm thấy bài viết phù hợp.";
    } catch {
        if (currentRevision === revision) {
            status.textContent = "Không tải được dữ liệu tìm kiếm.";
            retry.hidden = false;
        }
    }
}

function scheduleSearch({ immediate = false, historyMode = "replace" } = {}) {
    const query = input.value.slice(0, input.maxLength).trim();
    const topic = category.selectedOptions[0];
    const currentRevision = ++revision;
    clearTimeout(timer);
    results.replaceChildren();
    status.textContent = "";
    retry.hidden = true;

    if (historyMode) {
        const url = new URL(window.location.href);
        if (query) url.searchParams.set("keyword", query);
        else url.searchParams.delete("keyword");
        if (topic.value) url.searchParams.set("category", topic.value);
        else url.searchParams.delete("category");
        if (url.href !== window.location.href) {
            if (historyMode === "push") window.history.pushState(window.history.state, "", url);
            else window.history.replaceState(window.history.state, "", url);
        }
    }

    if (!query && !topic.value) return;
    if (immediate) search(query, topic, currentRevision);
    else timer = setTimeout(() => search(query, topic, currentRevision), 180);
}

function readLocation() {
    const params = new URLSearchParams(window.location.search);
    input.value = params.get("keyword")?.slice(0, input.maxLength) ?? "";
    category.value = params.get("category") ?? "";
    if (category.selectedIndex === -1) category.selectedIndex = 0;
    scheduleSearch({ immediate: true, historyMode: null });
}

form.addEventListener("submit", (event) => {
    event.preventDefault();
    scheduleSearch({ immediate: true });
});
input.addEventListener("input", (event) => {
    if (!event.isComposing) scheduleSearch();
});
input.addEventListener("compositionend", () => scheduleSearch());
category.addEventListener("change", () => scheduleSearch({ immediate: true, historyMode: "push" }));
retry.addEventListener("click", () => {
    (input.value ? input : category).focus();
    scheduleSearch({ immediate: true });
});
window.addEventListener("popstate", readLocation);
category.closest(".search-topic-filter").hidden = false;
readLocation();
