import { resources } from '@params';

const delimiters = [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
    { left: '\\(', right: '\\)', display: false },
    { left: '\\[', right: '\\]', display: true },
];
const ignoredTags = ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'];
const ignoredClasses = ['gist'];
const ignoredSelector = [...ignoredTags, ...ignoredClasses.map(name => `.${name}`)].join(',');

function hasMath(element) {
    const textNodes = document.createTreeWalker(
        element,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        node => {
            if (node.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
            return node.matches(ignoredSelector) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
        },
    );

    while (textNodes.nextNode()) {
        const node = textNodes.currentNode;
        if (node.previousSibling?.nodeType === Node.TEXT_NODE) continue;

        // KaTeX treats adjacent text nodes as a single run of text.
        let text = node.data;
        for (let sibling = node.nextSibling; sibling?.nodeType === Node.TEXT_NODE; sibling = sibling.nextSibling) {
            text += sibling.data;
        }

        if (delimiters.some(({ left, right }) => {
            const start = text.indexOf(left);
            return start >= 0 && text.includes(right, start + left.length);
        })) return true;
    }

    return false;
}

function loadResource({ src, integrity, type }) {
    return new Promise((resolve, reject) => {
        const isScript = type === 'script';
        const element = document.createElement(isScript ? 'script' : 'link');
        element.crossOrigin = 'anonymous';
        if (integrity) element.integrity = integrity;

        if (isScript) {
            // Download together and execute in order so auto-render can use KaTeX.
            element.async = false;
            element.src = src;
        } else {
            element.rel = 'stylesheet';
            element.href = src;
        }

        element.onload = resolve;
        element.onerror = () => reject(new Error(`Could not load ${src}`));
        document.head.append(element);
    });
}

const mathElements = [...document.querySelectorAll('.main-article, .widget--toc')].filter(hasMath);
if (mathElements.length) {
    Promise.all(resources.map(loadResource))
        .then(() => {
            for (const element of mathElements) {
                window.renderMathInElement(element, { delimiters, ignoredTags, ignoredClasses });
            }
        })
        .catch(error => console.warn('KaTeX is unavailable.', error));
}
