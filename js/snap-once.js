/* 
    Einmaliges Snap-Scrolling für Detailseiten:
        - springt vom Hero sanft zur nächsten Sektion
        - wird am Seitenanfang erneut aktiviert
*/

(() => {
    "use strict";

    /* --------------------------- Konfiguration --------------------------- */
    const MIN_WIDTH_QUERY = "(min-width: 1280px)"; // Mindestbreite, ab der Snap aktiviert wird
    const DESKTOP_INPUT_QUERY = "(hover: hover) and (pointer: fine)"; // Geräte mit präzisem Pointer
    const TOP_THRESHOLD = 8; // Bereich, in dem die Seite noch als "ganz oben" gilt
    const ANIMATION_DURATION = 1100; // Dauer der Scroll-Animation in ms
    const LOCK_DURATION = 1200; // Sperrzeit gegen Mehrfachauslösung in ms
    const WHEEL_THRESHOLD = 6; // Kleine Trackpad-Impulse ignorieren


    /* --------------------------- DOM Referenzen --------------------------- */ 
    const root = document.documentElement;
    const detailMain = document.querySelector("main.detailseite");


    /* --------------------------- Initiale Scrollposition --------------------------- */
    // Erzwingt auf Detailseiten einen Start ganz oben
    function resetScrollToTop() {
        if ("scrollRestoration" in history) {
            history.scrollRestoration = "manual";
        }

        window.scrollTo(0, 0);
    }


    /* --------------------------- State --------------------------- */  
    let isArmed = false; // Snap darf ausgelöst werden
    let isLocking = false; // Laufende Animation sperrt weitere Auslösung


    /* --------------------------- Feature Detection --------------------------- */
    // Prüft, ob der Viewport groß genug ist
    function isLargeViewport() {
        return window.matchMedia(MIN_WIDTH_QUERY).matches;
    }

    // Prüft, ob das Gerät einen präzisen Pointer besitzt
    function isSupportedInputDevice() {
        return window.matchMedia(DESKTOP_INPUT_QUERY).matches;
    }

    // Prüft, ob reduzierte Bewegung im System aktiviert ist
    function prefersReducedMotion() {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function hasReducedMotionPreference() {
        return document.documentElement.getAttribute("data-motion") === "reduced";
    }

    function shouldReduceMotion() {
        return prefersReducedMotion() || hasReducedMotionPreference();
    }


    /* --------------------------- Guards --------------------------- */
    // Sucht den CTA-Link im Hero-Bereich der Detailseite
    function getHeroCta() {
        return detailMain?.querySelector(".hero.snap-section .hero__actions a") || null;
    }

    // Ermittelt das Zielelement aus dem href des CTA-Links
    function getAnchorTarget(cta) {
        if (!cta) {
            return null;
        }

        const href = cta.getAttribute("href");

        if (!href || href === "#") {
            return null;
        }

        const hashIndex = href.indexOf("#");

        if (hashIndex === -1) {
            return null;
        }

        const targetSelector = href.slice(hashIndex);

        if (!targetSelector || targetSelector === "#") {
            return null;
        }

        return document.querySelector(targetSelector);
    }

    // Prüft, ob sich die Seite noch am oberen Rand befindet
    function isAtTop() {
        return window.scrollY <= TOP_THRESHOLD;
    }


    /* --------------------------- DOM Utilities --------------------------- */
    // Begrenzt einen Wert auf einen bestimmten Bereich
    function clamp(value, min, max) {
        return Math.max(min, Math.min(value, max));
    }

    // Prüft, ob ein Event in einem erlaubten Scrollbereich ausgelöst wurde
    function isInsideAllowedScrollArea(target) {
        return !!target.closest("[data-allow-scroll], .accordion__content");
    }


    /* --------------------------- Scroll Utilities --------------------------- */
    // Liest scroll-margin-top des Zielelements aus
    function getScrollMarginTop(element) {
        const styles = getComputedStyle(element);
        const value = parseFloat(styles.scrollMarginTop || "0");

        return Number.isFinite(value) ? value : 0;
    }

    // Berechnet die Zielposition wie bei einem normalen Anchor-Sprung
    function getTargetYLikeAnchor(element) {
        const rectTop = element.getBoundingClientRect().top;
        const marginTop = getScrollMarginTop(element);
        const rawTargetY = window.scrollY + rectTop - marginTop;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

        return clamp(Math.round(rawTargetY), 0, maxScroll);
    }

    // Easing-Funktion für eine weichere Animation
    function easeInOutCubic(t) {
        if (t < 0.5) {
            return 4 * t * t * t;
        }

        return 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Führt eine animierte Scrollbewegung zur Zielposition aus
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
    // Startet den einmaligen Snap zur Zielsektion
    function snapToTarget(targetElement, force = false) {
        if ((!isArmed && !force) || isLocking || !targetElement) {
            return;
        }

        isLocking = true;
        isArmed = false;

        const targetY = getTargetYLikeAnchor(targetElement);
        smoothScrollTo(targetY);

        window.setTimeout(() => {
            isLocking = false;
        }, LOCK_DURATION);
    }


    /* --------------------------- Event Handler --------------------------- */
    // Reagiert auf Scrollrad-Input und löst ggf. den Snap aus
    function handleWheel(event, targetElement) {
        // Interaktive / scrollbare Innenbereiche nicht hijacken
        if (isInsideAllowedScrollArea(event.target)) {
            return;
        }

        // Kleine Trackpad-Bewegungen ignorieren
        if (Math.abs(event.deltaY) < WHEEL_THRESHOLD) {
            return;
        }

        const scrollingDown = event.deltaY > 0;

        if (!isAtTop() || !scrollingDown) {
            return;
        }

        event.preventDefault();
        snapToTarget(targetElement);
    }

    // Reagiert auf Tastatur-Navigation
    function isInteractiveElement(target) {
        return target.closest("a, button, input, textarea, select, summary, details");
    }

    function handleKeydown(event, targetElement) {
        if (isInteractiveElement(event.target)) {
            return;
        }

        if (!isAtTop()) {
            return;
        }

        if (["ArrowDown", "PageDown", "Space"].includes(event.code)) {
            event.preventDefault();
            snapToTarget(targetElement);
        }
    }

    // Reagiert auf Klick auf den Hero-CTA
    function handleCtaClick(event, targetElement) {
        event.preventDefault();

        if (!targetElement) {
            return;
        }

        snapToTarget(targetElement, true);
    }

    // Aktiviert den Snap erneut, wenn die Seite wieder ganz oben ist
    function handleScroll() {
        if (isAtTop() && !isLocking) {
            isArmed = true;
            return;
        }

        if (!isAtTop() && isArmed) {
            isArmed = false;
        }
    }


    /* --------------------------- Event Listener --------------------------- */
    // Registriert alle benötigten Event Listener
    function registerListeners(targetElement, cta) {
        window.addEventListener("wheel", (event) => {
            handleWheel(event, targetElement);
        }, { passive: false });

        window.addEventListener("keydown", (event) => {
            handleKeydown(event, targetElement);
        });

        window.addEventListener("scroll", handleScroll, { 
            passive: true
        });

        cta.addEventListener("click", (event) => {
            handleCtaClick(event, targetElement);
        });
    }


    /* --------------------------- Initialisierung --------------------------- */
    // Initialisiert das Script nur unter passenden Bedingungen
    function init() {
        // Script nur auf Detailseiten ausführen
        if (!detailMain) {
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

        // Seite beim Aufruf immer oben starten
        resetScrollToTop();

        const cta = getHeroCta();
        const targetElement = getAnchorTarget(cta);

        // Guard Clause: CTA oder Ziel fehlt
        if (!cta || !targetElement) {
            return;
        }

        // Snap initial aktivieren, wenn Seite oben ist
        isArmed = isAtTop();

        // Listener registrieren
        registerListeners(targetElement, cta);
    }


    // das Script ist mit defer eingebungen & dadurch wird dieses Script erst nach dem Parsen des HTML ausgeführt
    init();
})();
