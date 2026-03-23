/*
    Scroll-Verhalten für die Startseite:
        - blendet die Hero-Überschrift beim Laden einmalig weich ein
        - blendet Teaser auf größeren Geräten beim ersten Sichtbarwerden ein
        - kein wiederholtes Reveal
        - berücksichtigt reduzierte Bewegung
        - deaktiviert Teaser-Reveal auf kleinen Geräten
*/

(() => {
    "use strict";

    /* --------------------------- Konfiguration --------------------------- */
    const MOBILE_MAX_WIDTH = 767;
    const HERO_REVEAL_DELAY = 120;


    /* --------------------------- DOM Referenzen --------------------------- */
    const heroTitle = document.querySelector(".startseite .hero__title--intro");

    const items = Array.from(
        document.querySelectorAll(".startseite .teaser.reveal")
    );


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
    // Setzt alle Teaser sofort sichtbar
    function showAllItems() {
        items.forEach((item) => {
            item.classList.add("is-visible");
        });
    }

    // Setzt die Hero-Überschrift sofort sichtbar
    function showHeroTitle() {
        if (!heroTitle) {
            return;
        }

        heroTitle.classList.add("is-visible");
    }

    // Aktiviert die Motion-Klasse nur dann, wenn Reveal wirklich genutzt wird
    function enableMotionEnhancement() {
        document.documentElement.classList.add("motion-enhanced");
    }


    /* --------------------------- Hero Reveal --------------------------- */
    // Blendet die Hero-Überschrift beim Laden leicht verzögert ein
    function revealHeroTitle() {
        if (!heroTitle) {
            return;
        }

        window.setTimeout(() => {
            heroTitle.classList.add("is-visible");
        }, HERO_REVEAL_DELAY);
    }


    /* --------------------------- Reveal Observer --------------------------- */
    // Erstellt einen Observer, der Teaser beim ersten Sichtbarwerden einblendet
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
            threshold: 0.12,
            rootMargin: "0px 0px -8% 0px"
        });
    }

    // Registriert alle Reveal-Elemente beim Observer
    function registerRevealObserver() {
        const observer = createRevealObserver();

        items.forEach((item) => {
            observer.observe(item);
        });
    }


    /* --------------------------- Initialisierung --------------------------- */
    function init() {
        // reduzierte Bewegung: alles sofort sichtbar
        if (shouldReduceMotion()) {
            showHeroTitle();
            showAllItems();
            return;
        }

        enableMotionEnhancement();
        revealHeroTitle();

        // ohne Reveal-Elemente ist keine weitere Scroll-Logik nötig
        if (!items.length) {
            return;
        }

        // Kleine Geräte: Teaser sofort sichtbar
        if (isSmallViewport()) {
            showAllItems();
            return;
        }

        // Reveal nur auf größeren Geräten aktivieren
        registerRevealObserver();
    }


    // das Script ist mit defer eingebungen & dadurch wird dieses Script erst nach dem Parsen des HTML ausgeführt
    init();
})();