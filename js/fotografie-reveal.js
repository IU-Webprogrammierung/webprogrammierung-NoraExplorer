/*
    Scroll-Verhalten für die Galerie-Sektion:
        - blendet Galerie-Items beim ersten Sichtbarwerden des Content-Bereichs einmalig nacheinander ein
        - kein wiederholter Reveal innerhalb der Galerie
        - berücksichtigt reduzierte Bewegung
        - deaktiviert Reveal auf kleinen Geräten
*/

(() => {
    "use strict";

    /* --------------------------- Konfiguration --------------------------- */
    const MOBILE_MAX_WIDTH = 767;


    /* --------------------------- DOM Referenzen --------------------------- */
    const contentSection = document.querySelector(".detailseite.seite-fotografie .content");
    const items = Array.from(document.querySelectorAll(".detailseite.seite-fotografie .galerie__item.reveal"));


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


    /* --------------------------- State Utilities --------------------------- */
    // Setzt alle Galerie-Items sofort sichtbar
    function showAllItems() {
        items.forEach((item) => {
            item.classList.add("is-visible");
        });
    }

    // Aktiviert die Motion-Klasse nur dann, wenn Reveal wirklich genutzt wird
    function enableMotionEnhancement() {
        document.documentElement.classList.add("motion-enhanced");
    }


    /* --------------------------- Reveal Observer --------------------------- */
    // Beobachtet nur den Content-Bereich und startet dann einmalig das gestaffelte Reveal
    function createRevealObserver() {
        return new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                showAllItems();
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.08,
            rootMargin: "0px 0px -4% 0px"
        });
    }

    // Registriert den Content-Bereich beim Observer
    function registerRevealObserver() {
        const observer = createRevealObserver();
        observer.observe(contentSection);
    }


    /* --------------------------- Initialisierung --------------------------- */
    function init() {
        // Script nur ausführen, wenn Content-Bereich und Reveal-Elemente vorhanden sind
        if (!contentSection || !items.length) {
            return;
        }

        // Kleine Geräte: Inhalte sofort sichtbar
        if (isSmallViewport()) {
            showAllItems();
            return;
        }

        // reduzierte Bewegung beachten
        if (shouldReduceMotion()) {
            showAllItems();
            return;
        }

        enableMotionEnhancement();
        registerRevealObserver();
    }


    // das Script ist mit defer eingebunden & dadurch wird dieses Script erst nach dem Parsen des HTML ausgeführt
    init();
})();