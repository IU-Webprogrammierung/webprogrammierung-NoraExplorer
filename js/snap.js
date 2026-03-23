/* 
    Panelartiges Scollen für die Startseite:
        - navigiert zwischen den direkten Sektionen
        - ergänzt den Footer als letztes Ziel
*/

(() => {
    "use strict";

    /* --------------------------- Konfiguration --------------------------- */
    const MIN_WIDTH_QUERY = "(min-width: 1280px)"; // Mindestbreite, ab der das panelartige Scrollen aktiv wird
    const DESKTOP_INPUT_QUERY = "(hover: hover) and (pointer: fine)"; // Media Query für Geräte mit präzisem Pointer
    const ANIMATION_DURATION = 1100;  // Dauer der Scroll-Animation in ms
    const LOCK_DURATION = 1200; // Sperrzeit gegen Mehrfachauslösung in ms
    const WHEEL_THRESHOLD = 6; // Kleine Trackpad-Impulse ignorieren
    const ACTIVE_PANEL_OFFSET = 10; // Kleiner Offset für die Erkennung des aktuellen Panels


    /* --------------------------- DOM Referenzen --------------------------- */
    const startMain = document.querySelector("main.startseite");
    const footer = document.getElementById("site-footer");


    /* --------------------------- State --------------------------- */
    let isLocking = false;


    /* --------------------------- Feature Detection --------------------------- */
    // Prüft, ob der Viewport groß genug ist
    function isLargeViewport() {
        return window.matchMedia(MIN_WIDTH_QUERY).matches;
    }

    // Prüft, ob das Gerät einen präzisen Pointer besitzt
    function isSupportedInputDevice() {
        return window.matchMedia(DESKTOP_INPUT_QUERY).matches;
    }

    /* --------------------------- Motion Utilities --------------------------- */
    // Prüft die Systempräferenz für reduzierte Bewegung
    function prefersReducedMotion() {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function hasReducedMotionPreference() {
        return document.documentElement.getAttribute("data-motion") === "reduced";
    }

    function shouldReduceMotion() {
        return prefersReducedMotion() || hasReducedMotionPreference();
    }


    /* --------------------------- DOM Utilities --------------------------- */
    // Sammelt alle Panels der Startseite inklusive Footer
    function getPanels() {
        if (!startMain) {
            return [];
        }

        return [
            ...startMain.querySelectorAll(":scope > [data-snap-panel]"),
            footer
        ].filter(Boolean);
    }

     // Liefert die aktuelle Höhe des Headers
    function getHeaderHeight() {
        const header = document.getElementById("site-header");
        return header ? header.offsetHeight : 0;
    }

    // Begrenzt einen Wert auf einen bestimmten Bereich
    function clamp(value, min, max) {
        return Math.max(min, Math.min(value, max));
    }

    // Prüft, ob ein Event in einem erlaubten Scrollbereich ausgelöst wurde
    function isInsideAllowedScrollArea(target) {
        return !!target.closest("[data-allow-scroll], .accordion__content");
    }


    /* --------------------------- Scroll Utilities --------------------------- */
    // Berechnet die Scroll-Zielposition für ein Panel
    function getTargetYForPanel(panelElement) {

        const rect = panelElement.getBoundingClientRect();
        const panelTopInDocument = window.scrollY + rect.top;
        const panelHeight = rect.height;

        const headerHeight = getHeaderHeight();
        const usableViewportHeight = window.innerHeight - headerHeight;

        // Ziel: Panel innerhalb des sichtbaren Bereichs unter dem Header zentrieren
        const targetY = panelTopInDocument - headerHeight - (usableViewportHeight - panelHeight) / 2;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

        return clamp(targetY, 0, maxScroll);
    }

     // Easing-Funktion für eine weichere Animation
    function easeInOutCubic(t) {
        if (t < 0.5) {
            return 4 * t * t * t;
        }

        return 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Scrollt animiert zur berechneten Zielposition
    function smoothScrollTo(targetY, duration = ANIMATION_DURATION) {
        const startY = window.scrollY;
        const distance = targetY - startY;
        let startTime = null;

        // Einzelner Animationsschritt
        function step(timestamp) {
            if (!startTime) {
                startTime = timestamp;
            }

            const progress = Math.min((timestamp - startTime) / duration, 1);
            const easedProgress = easeInOutCubic(progress);

            window.scrollTo(0, startY + distance * easedProgress);

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        }

        window.requestAnimationFrame(step);
    }


    /* --------------------------- Core Logik --------------------------- */
    // Bestimmt das aktuell nächste Panel zur aktuellen Scrollposition
    function getCurrentPanelIndex(panels) {
        const currentY = window.scrollY + ACTIVE_PANEL_OFFSET;

        let bestIndex = 0;
        let bestDistance = Infinity;

        // Jedes Panel prüfen
        panels.forEach((panel, index) => {
            const targetY = getTargetYForPanel(panel);
            const distance = Math.abs(targetY - currentY);

            if (distance < bestDistance) {
                bestDistance = distance;
                bestIndex = index;
            }
        });

        return bestIndex;
    }

    // Wechselt relativ zum aktuellen Panel
    function goToPanel(delta, panels) {
    if (isLocking || panels.length < 2) {
        return;
    }

    isLocking = true;

    const currentIndex = getCurrentPanelIndex(panels);
    const nextIndex = clamp(currentIndex + delta, 0, panels.length - 1);

    if (nextIndex === currentIndex) {
        isLocking = false;
        return;
    }

    let targetY;

    // Sonderfall: wenn man ganz oben im Hero ist und nach unten scrollt, dann zuerst zum oberen Rand des Hero-Overlays springen
    const firstPanel = panels[0];
    const isHeroFirstPanel = firstPanel?.classList.contains("hero");
    const isFirstScrollDownFromHero = delta > 0 && currentIndex === 0 && nextIndex === 1;

    if (isHeroFirstPanel && isFirstScrollDownFromHero) {
        const overlay = firstPanel.querySelector(".heading-overlay");

        if (overlay) {
            const overlayRect = overlay.getBoundingClientRect();
            const overlayTopInDocument = window.scrollY + overlayRect.top;
            const headerHeight = getHeaderHeight();
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

            targetY = clamp(overlayTopInDocument - headerHeight, 0, maxScroll);
        }
    }

    // Standardverhalten für alle anderen Sprünge
    if (targetY === undefined) {
        targetY = getTargetYForPanel(panels[nextIndex]);
    }

    smoothScrollTo(targetY);

    window.setTimeout(() => {
        isLocking = false;
    }, LOCK_DURATION);
}


    /* --------------------------- Event Handler --------------------------- */
    // Reagiert auf Scrollrad-Input
    function handleWheel(event, panels) {
        // interaktive / scrollbare Innenbereiche nicht hijacken
        if (isInsideAllowedScrollArea(event.target)) {
            return;
        }

        // kleine Trackpad-Bewegungen ignorieren
        if (Math.abs(event.deltaY) < WHEEL_THRESHOLD) {
            return;
        }

        event.preventDefault();

        if (event.deltaY > 0) {
            goToPanel(1, panels);
        } else {
            goToPanel(-1, panels);
        }
    }

    // Reagiert auf Tastatur-Navigation
    function isInteractiveElement(target) {
        return target.closest("a, button, input, textarea, select, summary, details");
    }

    function handleKeydown(event, panels) {
        if (isInteractiveElement(event.target)) {
            return;
        }

        if (["ArrowDown", "PageDown", "Space"].includes(event.code)) {
            event.preventDefault();
            goToPanel(1, panels);
            return;
        }

        if (["ArrowUp", "PageUp"].includes(event.code)) {
            event.preventDefault();
            goToPanel(-1, panels);
        }
    }


    /* --------------------------- Event Listener --------------------------- */
    // Registriert die Event Listener für die Panel-Navigation
    function registerListeners(panels) {
        window.addEventListener("wheel", (event) => {
            handleWheel(event, panels);
        }, { passive: false });

        window.addEventListener("keydown", (event) => {
            handleKeydown(event, panels);
        });
    }


    /* --------------------------- Initialisierung --------------------------- */
    // Initialisiert das Script nur auf der Startseite
    function init() {
        // Script nur auf der Startseite ausführen
        if (!startMain) {
            return;
        }

        // nur auf großen Desktop-Viewports aktivieren
        if (!isLargeViewport() || !isSupportedInputDevice()) {
            return;
        }

        // reduzierte Bewegung respektieren
        if (shouldReduceMotion()) {
            return;
        }

        const panels = getPanels();

        // Guard Clause: mindestens zwei Snap-Ziele benötigt
        if (panels.length < 2) {
            return;
        }

        registerListeners(panels);
    }

    // das Script ist mit defer eingebungen & dadurch wird dieses Script erst nach dem Parsen des HTML ausgeführt
    init();
})();

