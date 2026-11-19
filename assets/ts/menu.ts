export default function setupMenu() {
    const menu = document.getElementById("main-menu");
    const toggle = document.getElementById("toggle-menu");

    if (menu && toggle) {
        const setExpanded = (expanded: boolean) => {
            menu.classList.toggle("show", expanded);
            toggle.classList.toggle("is-active", expanded);
            toggle.setAttribute("aria-expanded", String(expanded));
        };

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && menu.classList.contains("show") && toggle.getClientRects().length) {
                setExpanded(false);
                toggle.focus();
            }
        };

        toggle.setAttribute("aria-controls", menu.id);
        setExpanded(false);
        menu.querySelector("li.current > a")?.setAttribute("aria-current", "page");

        toggle.addEventListener("click", () => setExpanded(!menu.classList.contains("show")));
        toggle.addEventListener("keydown", closeOnEscape);
        menu.addEventListener("keydown", closeOnEscape);
    }

    const colorToggle = document.getElementById("dark-mode-toggle");
    if (colorToggle) {
        const syncColorScheme = () => {
            colorToggle.setAttribute("aria-pressed", String(document.documentElement.dataset.scheme === "dark"));
        };

        colorToggle.tabIndex = 0;
        colorToggle.setAttribute("role", "button");
        syncColorScheme();
        window.addEventListener("onColorSchemeChange", syncColorScheme);

        colorToggle.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                if (!event.repeat) colorToggle.click();
            }
        });
    }
}
