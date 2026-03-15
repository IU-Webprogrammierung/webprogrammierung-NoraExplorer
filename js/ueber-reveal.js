/* 
    Scroll-Verhalten für die Interessen-Sektion:
        - blendet Interessen auf größeren Geräten beim ersten Sichtbarwerden ein
        - markiert den aktuell relevantesten Interessen-Block
        - berücksichtigt reduzierte Bewegung
        - deaktiviert Reveal auf kleinen Geräten, behält aber den Active-State
*/

(() => {
    "use strict";

    /* --------------------------- Konfiguration --------------------------- */
    const MOBILE_MAX_WIDTH = 767;
    const ACTIVE_LINE_RATIO = 0.52;


    /* --------------------------- DOM Referenzen --------------------------- */
    const items = Array.from(document.querySelectorAll(".detailseite.seite-ueber .interesse.reveal"));


    /* --------------------------- Motion Utilities --------------------------- */
    // Prüft, ob reduzierte Bewegung im System aktiviert ist
    function prefersReducedMotion() {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    // Prüft, ob der Nutzer in den Einstellungen reduzierte Bewegung gewählt hat
    function hasReducedMotionPreference() {
        return document.documentElement.getAttribute("data-motion") === "reduced";
    }

    // Fasst System- und User-Präferenz zusammen
    function shouldReduceMotion() {
        return prefersReducedMotion() || hasReducedMotionPreference();
    }


    /* --------------------------- Viewport Utilities --------------------------- */
    // Prüft, ob aktuell ein kleiner Bildschirm aktiv ist
    function isSmallViewport() {
        return window.innerWidth <= MOBILE_MAX_WIDTH;
    }

    // bestimmt die gedachte aktive Linie im Viewport
    function getActiveLineY() {
        return window.innerHeight * ACTIVE_LINE_RATIO;
    }


    /* --------------------------- State Utilities --------------------------- */
    // Setzt alle Interessen sofort sichtbar
    function showAllItems() {
        items.forEach((item) => {
            item.classList.add("is-visible");
        });
    }

    // Entfernt aktive Markierungen
    function clearActiveState() {
        items.forEach((item) => {
            item.classList.remove("is-active");
        });
    }

    // Setzt den aktuell relevantesten Block auf aktiv
    function updateActiveItem() {
        const activeLineY = getActiveLineY();

        let bestItem = null;
        let bestDistance = Infinity;

        items.forEach((item) => {
            const rect = item.getBoundingClientRect();
            const itemCenter = rect.top + (rect.height / 2);
            const distance = Math.abs(itemCenter - activeLineY);

            if (distance < bestDistance) {
                bestDistance = distance;
                bestItem = item;
            }
        });

        clearActiveState();

        if (bestItem) {
            bestItem.classList.add("is-active");
        }
    }


    /* --------------------------- Reveal Observer --------------------------- */
    // Erstellt einen Observer, der Elemente beim ersten Sichtbarwerden einblendet
    function createRevealObserver() {
        return new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.08,
            rootMargin: "0px 0px 0px 0px"
        });
    }

    // Registriert alle Interessen-Elemente beim Observer
    function registerRevealObserver() {
        const observer = createRevealObserver();

        items.forEach((item) => {
            observer.observe(item);
        });
    }


    /* --------------------------- Event Binding --------------------------- */
    function registerStateListeners() {
        window.addEventListener("scroll", updateActiveItem, { passive: true });
        window.addEventListener("resize", updateActiveItem);
        window.addEventListener("load", updateActiveItem);
    }


    /* --------------------------- Initialisierung --------------------------- */
    function init() {
        // Script nur ausführen, wenn Reveal-Elemente vorhanden sind
        if (!items.length) {
            return;
        }

        // Kleine Geräte: Inhalte sofort sichtbar, aber Active-State bleibt aktiv
        if (isSmallViewport()) {
            showAllItems();
            registerStateListeners();
            updateActiveItem();
            return;
        }

        // reduzierte Bewegung beachten
        if (shouldReduceMotion()) {
            showAllItems();
            registerStateListeners();
            updateActiveItem();
            return;
        }

        // Reveal nur auf größeren Geräten aktivieren
        registerRevealObserver();

        // Active-State immer separat aktualisieren
        registerStateListeners();
        updateActiveItem();
    }


    // das Script ist mit defer eingebunden & dadurch wird dieses Script erst nach dem Parsen des HTML ausgeführt
    init();
})();