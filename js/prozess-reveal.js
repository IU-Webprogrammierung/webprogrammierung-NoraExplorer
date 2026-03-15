/*
    Scroll-Verhalten für die Prozesssektion:
    - blendet Schritte beim ersten Sichtbarwerden ein
    - markiert den aktuell relevanten Schritt
    - bewegt die Timeline weich von Schritt zu Schritt
    - markiert bereits erreichte Schritte als "is-passed"
*/

(() => {
    "use strict";

    /* --------------------------- Konfigurationen --------------------------- */
    // Verhältnis der "aktiven Linie" im Viewport
    const ACTIVE_LINE_RATIO = 0.56;


    /* --------------------------- DOM Referenzen --------------------------- */
    const items = Array.from(document.querySelectorAll(".prozess__item.reveal"));
    const timeline = document.querySelector(".detailseite.seite-prozess .prozess");


    // requestAnimationFrame-Sperre: verhindert unnötig viele Updates während des Scrollens
    let ticking = false;


    /* --------------------------- Motion Utilities --------------------------- */
    function prefersReducedMotion() {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function hasReducedMotionPreference() {
        return document.documentElement.getAttribute("data-motion") === "reduced";
    }

    function shouldReduceMotion() {
        return prefersReducedMotion() || hasReducedMotionPreference();
    }


    /* --------------------------- State Utilities --------------------------- */
    function showAllItems() {
        items.forEach((item) => {
            item.classList.add("is-visible");
        });
    }

    function clearState() {
        items.forEach((item) => {
            item.classList.remove("is-active", "is-passed");
        });
    }


    /* --------------------------- Position Utilities --------------------------- */
    function getActiveLineY() {
        return window.innerHeight * ACTIVE_LINE_RATIO;
    }

    // Ermittelt den Mittelpunkt des Nummernkreises relativ zur gesamten Prozessliste. Diese Werte nutzt die Timeline
    function getCircleCenterOffset(item) {
        const circle = item.querySelector(".prozessschritt__nr");

        if (!circle || !timeline) {
            return 0;
        }

        const timelineRect = timeline.getBoundingClientRect();
        const circleRect = circle.getBoundingClientRect();

        return (circleRect.top + (circleRect.height / 2)) - timelineRect.top;
    }

    function getItemCenterY(item) {
        const rect = item.getBoundingClientRect();
        return rect.top + (rect.height / 2);
    }


    // Sucht den Schritt, dessen Mittelpunkt der aktiven Linie im Viewport am nächsten ist
    function getClosestItemToActiveLine() {
        const activeLineY = getActiveLineY();

        let bestItem = null;
        let bestDistance = Infinity;

        items.forEach((item) => {
            const distance = Math.abs(getItemCenterY(item) - activeLineY);

            if (distance < bestDistance) {
                bestDistance = distance;
                bestItem = item;
            }
        });

        return bestItem;
    }


    /* --------------------------- Timeline Utilities--------------------------- */
    // Berechnet Start und Länge der Timeline anhand des ersten und letzten Kreismittelpunkts
    function updateTimelineMetrics() {
        if (!timeline || items.length === 0) {
            return null;
        }

        const firstOffset = getCircleCenterOffset(items[0]);
        const lastOffset = getCircleCenterOffset(items[items.length - 1]);
        const length = Math.max(0, lastOffset - firstOffset);

        timeline.style.setProperty("--timeline-start", `${firstOffset}px`);
        timeline.style.setProperty("--timeline-length", `${length}px`);

        return { firstOffset, lastOffset };
    }

    // Aktualisiert: aktive/passed Klassen & Timeline-Fortschritt
    function updateStates() {
        if (!timeline || items.length === 0) {
            return;
        }

        const activeItem = getClosestItemToActiveLine();

        if (!activeItem) {
            return;
        }

        const activeIndex = items.indexOf(activeItem);
        const metrics = updateTimelineMetrics();

        if (!metrics) {
            return;
        }

        const activeOffset = getCircleCenterOffset(activeItem);
        const progress = Math.max(0, activeOffset - metrics.firstOffset);

        timeline.style.setProperty("--timeline-progress", `${progress}px`);

        clearState();

        items.forEach((item, index) => {
            if (index < activeIndex) {
                item.classList.add("is-passed");
            }

            if (index === activeIndex) {
                item.classList.add("is-active");
            }
        });
    }

    // Scroll- und Resize-Updates werden über requestAnimationFrame gebündelt, um die Performance stabil zu halten
    function requestStateUpdate() {
        if (ticking) {
            return;
        }

        ticking = true;

        window.requestAnimationFrame(() => {
            updateStates();
            ticking = false;
        });
    }


    /* --------------------------- Reveal Observer --------------------------- */
    // Blendet Schritte beim ersten Sichtbarwerden ein und beobachtet sie danach nicht weiter
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

    function registerRevealObserver() {
        const observer = createRevealObserver();

        items.forEach((item) => {
            observer.observe(item);
        });
    }


    /* --------------------------- Event Binding --------------------------- */
    function registerStateListeners() {
        window.addEventListener("scroll", requestStateUpdate, { passive: true });
        window.addEventListener("resize", requestStateUpdate);
        window.addEventListener("load", requestStateUpdate);
    }


    /* --------------------------- Initialisierung --------------------------- */
    function init() {
        if (!timeline || items.length === 0) {
            return;
        }

        if (shouldReduceMotion()) {
            showAllItems();
        } else {
            registerRevealObserver();
        }

        registerStateListeners();
        updateStates();
    }

    // das Script ist mit defer eingebungen & dadurch wird dieses Script erst nach dem Parsen des HTML ausgeführt
    init();
})();