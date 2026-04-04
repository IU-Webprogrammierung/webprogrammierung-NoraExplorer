/* 
    Intro-Motion für Hero- und Teaser-Bilder:
        - blendet Hero-Bild, Titel und Lead auf Detailseiten einmalig gestaffelt ein
        - blendet Teaser-Bilder weich und leicht versetzt ein
        - berücksichtigt reduzierte Bewegung
        - deaktiviert Motion auf kleinen Geräten
*/

(() => {
    "use strict";

    /* --------------------------- Konfiguration --------------------------- */
    const MOBILE_MAX_WIDTH = 767; // maximale Breite, unter der Motion deaktiviert bleibt

    const HERO_DELAY = 80; // Verzögerung für das Hero-Bild in ms
    const HERO_TEXT_DELAY = 180; // Verzögerung für den Hero-Titel in ms
    const HERO_LEAD_DELAY = 280; // Verzögerung für den Hero-Lead in ms

    const TEASER_STAGGER = 90;// zeitlicher Abstand zwischen einzelnen Teaser-Reveals in ms


    /* --------------------------- DOM Referenzen --------------------------- */
    const heroMedia = document.querySelector(".detailseite .hero__media");
    const heroTitle = document.querySelector(".detailseite .hero__title");
    const heroLead = document.querySelector(".detailseite .hero__lead");

    const teaserMedia = Array.from(
        document.querySelectorAll(".teaser__media")
    );


    /* --------------------------- Motion Utilities --------------------------- */
    // Prüft, ob reduzierte Bewegung im System aktiviert ist
    function prefersReducedMotion() {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    // Prüft, ob im Projekt selbst reduzierte Bewegung eingestellt wurde
    function hasReducedMotionPreference() {
        return document.documentElement.getAttribute("data-motion") === "reduced";
    }

    // Fasst System- und User-Präferenz zusammen
    function shouldReduceMotion() {
        return prefersReducedMotion() || hasReducedMotionPreference();
    }


    /* --------------------------- Viewport Utilities --------------------------- */
    // Erkennt kleine Viewports, auf denen Motion deaktiviert bleibt
    function isSmallViewport() {
        return window.innerWidth <= MOBILE_MAX_WIDTH;
    }


    /* --------------------------- State Utilities --------------------------- */
    // Setzt alle Hero-Elemente sofort sichtbar
    function showHeroImmediately() {
        if (heroMedia) {
            heroMedia.classList.add("is-visible");
        }

        if (heroTitle) {
            heroTitle.classList.add("is-visible");
        }

        if (heroLead) {
            heroLead.classList.add("is-visible");
        }
    }

    // Setzt alle Teaser-Elemente sofort sichtbar
    function showAllTeasersImmediately() {
        teaserMedia.forEach((el) => {
            el.classList.add("is-visible");
        });
    }

    // Aktiviert Motion nur explizit über die Root-Klasse
    function enableMotionEnhancement() {
        document.documentElement.classList.add("motion-enhanced");
    }


    /* --------------------------- Hero Animation --------------------------- */
    // Blendet die Hero-Elemente zeitlich gestaffelt ein
    function revealHero() {
        if (heroMedia) {
            window.setTimeout(() => {
                heroMedia.classList.add("is-visible");
            }, HERO_DELAY);
        }

        if (heroTitle) {
            window.setTimeout(() => {
                heroTitle.classList.add("is-visible");
            }, HERO_TEXT_DELAY);
        }

        if (heroLead) {
            window.setTimeout(() => {
                heroLead.classList.add("is-visible");
            }, HERO_LEAD_DELAY);
        }
    }


    /* --------------------------- Teaser Animation --------------------------- */
    // Blendet Teaser-Elemente leicht versetzt nacheinander ein
    function revealTeasers() {
        teaserMedia.forEach((el, index) => {
            window.setTimeout(() => {
                el.classList.add("is-visible");
            }, index * TEASER_STAGGER);
        });
    }


    /* --------------------------- Initialisierung --------------------------- */
    function init() {
        // Guard Clause: keine relevanten Elemente vorhanden
        if (!heroMedia && !heroTitle && !heroLead && !teaserMedia.length) {
            return;
        }

        // reduzierte Bewegung respektieren
        if (shouldReduceMotion()) {
            showHeroImmediately();
            showAllTeasersImmediately();
            return;
        }

        // auf kleinen Geräten ebenfalls ohne Motion arbeiten
        if (isSmallViewport()) {
            showHeroImmediately();
            showAllTeasersImmediately();
            return;
        }

        // Motion explizit aktivieren
        enableMotionEnhancement();

        // Animationen starten
        revealHero();
        revealTeasers();
    }

    // das Script ist mit defer eingebungen & dadurch wird dieses Script erst nach dem Parsen des HTML ausgeführt
    init();
})();