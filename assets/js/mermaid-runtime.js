const palette = {
    light: {
        canvas: "#f7fbff",
        node: "#e9f3ff",
        outline: "#6389b1",
        text: "#173b59",
        line: "#516c86",
        group: "#edf4fa",
        note: "#fff3d5",
        noteText: "#573b17",
        noteBorder: "#b99555",
    },
    dark: {
        canvas: "#0d1723",
        node: "#0e3457",
        outline: "#426e96",
        text: "#b9e3ff",
        line: "#9aafc5",
        group: "#162639",
        note: "#3b2b18",
        noteText: "#ffe0aa",
        noteBorder: "#9c7950",
    },
};

let libraryRequest;
let pendingRender = Promise.resolve();
let diagramNumber = 0;

export function getMermaidScheme() {
    return document.documentElement.dataset.scheme === "dark" ? "dark" : "light";
}

function loadMermaid(libraryUrl) {
    if (!libraryRequest) {
        libraryRequest = new Promise((resolve, reject) => {
            const address = new URL(libraryUrl, window.location.href);
            if (address.origin !== window.location.origin) {
                reject(new Error("Không mở được thư viện Mermaid của blog."));
                return;
            }

            const script = document.createElement("script");
            const timeout = setTimeout(unavailable, 15000);
            function unavailable() {
                clearTimeout(timeout);
                script.remove();
                reject(new Error("Không tải được Mermaid."));
            }

            script.src = address.href;
            script.onerror = unavailable;
            script.onload = () => {
                if (!window.mermaid?.render) {
                    unavailable();
                    return;
                }
                clearTimeout(timeout);
                resolve(window.mermaid);
            };
            document.head.append(script);
        }).catch((error) => {
            libraryRequest = undefined;
            throw error;
        });
    }
    return libraryRequest;
}

function mermaidOptions(scheme, untrusted) {
    const colors = palette[scheme];
    return {
        startOnLoad: false,
        securityLevel: "strict",
        suppressErrorRendering: true,
        // Mermaid's source-level configuration cannot loosen these settings.
        secure: [
            "secure", "securityLevel", "startOnLoad", "maxTextSize", "maxEdges",
            "suppressErrorRendering", "dompurifyConfig", "themeCSS", "themeVariables",
        ],
        maxTextSize: untrusted ? 24000 : 75000,
        maxEdges: untrusted ? 300 : 1000,
        theme: "base",
        look: "classic",
        fontFamily: "system-ui, 'Segoe UI', sans-serif",
        htmlLabels: true,
        themeVariables: {
            darkMode: scheme === "dark",
            background: colors.canvas,
            fontSize: "15px",
            primaryColor: colors.node,
            primaryBorderColor: colors.outline,
            primaryTextColor: colors.text,
            lineColor: colors.line,
            textColor: colors.text,
            mainBkg: colors.node,
            nodeBorder: colors.outline,
            nodeTextColor: colors.text,
            secondaryColor: colors.group,
            secondaryTextColor: colors.text,
            tertiaryColor: colors.group,
            tertiaryTextColor: colors.text,
            clusterBkg: colors.group,
            clusterBorder: colors.outline,
            titleColor: colors.text,
            edgeLabelBackground: colors.canvas,
            actorBkg: colors.node,
            actorBorder: colors.outline,
            actorTextColor: colors.text,
            actorLineColor: colors.line,
            signalColor: colors.line,
            signalTextColor: colors.text,
            labelBoxBkgColor: colors.group,
            labelTextColor: colors.text,
            loopTextColor: colors.text,
            noteBkgColor: colors.note,
            noteTextColor: colors.noteText,
            noteBorderColor: colors.noteBorder,
            activationBkgColor: colors.group,
            activationBorderColor: colors.outline,
        },
        flowchart: {
            curve: "rounded",
            nodeSpacing: 36,
            rankSpacing: 48,
            padding: 15,
            wrappingWidth: 240,
            useMaxWidth: false,
        },
        sequence: {
            useMaxWidth: false,
            diagramMarginX: 28,
            diagramMarginY: 20,
            messageMargin: 32,
        },
    };
}

function prepareSvg(markup) {
    const template = document.createElement("template");
    template.innerHTML = markup;
    const svg = template.content.firstElementChild;
    if (!svg || svg.localName !== "svg") throw new Error("Mermaid không trả về sơ đồ SVG.");

    // Keep the SVG's native dimensions so wide diagrams can scroll instead of shrinking labels.
    const viewBox = svg.getAttribute("viewBox")?.trim().split(/[\s,]+/).map(Number);
    if (viewBox?.length === 4 && viewBox[2] > 0 && viewBox[3] > 0) {
        svg.setAttribute("width", String(viewBox[2]));
        svg.setAttribute("height", String(viewBox[3]));
        svg.style.removeProperty("max-width");
    }
    if (!svg.hasAttribute("aria-labelledby") && !svg.hasAttribute("aria-label")) {
        svg.setAttribute("aria-label", "Sơ đồ Mermaid");
    }
    if (svg.getAttribute("aria-roledescription")?.startsWith("flowchart")) {
        for (const rect of svg.querySelectorAll("g.node rect.label-container")) {
            if (+rect.getAttribute("rx") > 0) continue;
            rect.setAttribute("rx", "13");
            rect.setAttribute("ry", "13");
        }
    }
    return svg.outerHTML;
}

export function renderBlogMermaid(source, { libraryUrl, scheme = getMermaidScheme(), untrusted = false } = {}) {
    const task = pendingRender.then(async () => {
        if (!source.trim()) throw new Error("Sơ đồ Mermaid chưa có nội dung.");
        if (untrusted && /(?:@\s*\{[^}]*\b(?:img|image)\s*["']?\s*:|<\s*(?:img|image|iframe)\b|@import\b|url\s*\()/is.test(source)) {
            throw new Error("Bản xem trước hỗ trợ sơ đồ dùng nút và nhãn nội bộ.");
        }
        const mermaid = await loadMermaid(libraryUrl);
        mermaid.initialize(mermaidOptions(scheme, untrusted));
        const { svg } = await mermaid.render("raiii-mermaid-" + ++diagramNumber, source);
        return prepareSvg(svg);
    });
    pendingRender = task.catch(() => {});
    return task;
}
