/* 
    Einmaliges Snap-Scrolling für Detailseiten:
        - Springt vom Hero sanft zur nächten Sektion
        - wird am Seitenanfang eerneut aktiviert
*/

(() => {
    "use strict";

    /* --------------------------- Konfiguration --------------------------- */
    const TOP_THRESHOLD = 8; 
    const ANIMATION_DURATION = 1100; // Dauer der Scroll-Animation in ms
    const LOCK_DURATION = 1200; // Sperrzeit gegen Mehrfachauslösung in ms


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
    // Prüft, ob das Gerät einen feinen Pointer wie Maus oder Trackpad besitzt
    function isSupportedInputDevice() {
        return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    }

    // Prüft, ob reduzierte Bewegung im System aktiviert ist
    function prefersReducedMotion() {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    // Prüft die benutzerdefinierte Bewegungspräferenz aus dem HTML
    function hasReducedMotionPreference() {
        return document.documentElement.getAttribute("data-motion") === "reduced";
    }

    // Fasst beide Reduced-Motion-Varianten zusammen
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


    /* --------------------------- State Utilities --------------------------- */
    // Setzt den Armed-State und synchronisiert die CSS-Klasse
    function setArmedState(nextState) {
        isArmed = nextState;
        root.classList.toggle("snap-active", isArmed);
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

        return window.scrollY + rectTop - marginTop;
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
        setArmedState(false);

        const targetY = getTargetYLikeAnchor(targetElement);
        smoothScrollTo(targetY);

        window.setTimeout(() => {
            isLocking = false;
        }, LOCK_DURATION);
    }


    /* --------------------------- Event Handler --------------------------- */
    // Reagiert auf Scrollrad-Input und löst ggf. den Snap aus
    function handleWheel(event, targetElement) {
        const scrollingDown = event.deltaY > 0;

        if (!isAtTop() || !scrollingDown) {
            return;
        }

        event.preventDefault();
        snapToTarget(targetElement);
    }

    // Reagiert auf Tastatur-Navigation
    function handleKeydown(event, targetElement) {
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
        const atTop = isAtTop();

        if (atTop && !isArmed && !isLocking) {
            setArmedState(true);
            return;
        }

        if (!atTop && isArmed) {
            setArmedState(false);
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

        window.addEventListener("pageshow", () => {
            if (detailMain) {
                resetScrollToTop();
            }
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

        // reduzierte Bewegung respektieren: dann kein Snap, keine Scroll-Hijacks, normales Seitenverhalten
        if (shouldReduceMotion()) {
            return;
        }

        // Seite beim Aufruf immer oben starten
        resetScrollToTop();

        // nur auf Desktop-/Pointer-Geräten aktivieren
        if (!isSupportedInputDevice()) {
            return;
        }

        const cta = getHeroCta();
        const targetElement = getAnchorTarget(cta);

        // Guard Clause: CTA oder Ziel fehlt
        if (!cta || !targetElement) {
            return;
        }

        // Snap initial aktivieren, wenn Seite oben is
        setArmedState(isAtTop());

        // Listener registrieren
        registerListeners(targetElement, cta);
    }


    // das Script ist mit defer eingebungen & dadurch wird dieses Script erst nach dem Parsen des HTML ausgeführt
    init();
})();
