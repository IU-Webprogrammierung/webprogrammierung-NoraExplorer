/*
    Scroll- und Interaktionsverhalten für die Projekte-Sektion:
        - blendet Projekte auf größeren Geräten beim ersten Sichtbarwerden ein
        - markiert den aktuell relevantesten Projekt-Block
        - animiert das Öffnen und Schließen der <details>-Bereiche weich in beide Richtungen
        - berücksichtigt reduzierte Bewegung
        - deaktiviert Reveal auf kleinen Geräten, behält aber den Active-State
*/

(() => {
    "use strict";

    /* --------------------------- Konfiguration --------------------------- */
    const MOBILE_MAX_WIDTH = 767;
    const ACTIVE_LINE_RATIO = 0.52;
    const DETAILS_ANIMATION_DURATION = 620;


    /* --------------------------- DOM Referenzen --------------------------- */
    // alle Projekt-Elemente, die per Scroll-Reveal eingeblendet werden sollen
    const items = Array.from(
        document.querySelectorAll(".detailseite.seite-projekte .projekt.reveal")
    );

    // alle nativen <details>-Container der Projektseite
    const detailsElements = Array.from(
        document.querySelectorAll(".detailseite.seite-projekte .projekt__details")
    );


    /* --------------------------- Motion Utilities --------------------------- */
    // prüft, ob reduzierte Bewegung im Betriebssystem aktiviert ist
    function prefersReducedMotion() {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    // prüft, ob im Projekt selbst reduzierte Bewegung eingestellt wurde
    function hasReducedMotionPreference() {
        return document.documentElement.getAttribute("data-motion") === "reduced";
    }

    // fasst System- und User-Präferenz zusammen
    function shouldReduceMotion() {
        return prefersReducedMotion() || hasReducedMotionPreference();
    }


    /* --------------------------- Viewport Utilities --------------------------- */
    // erkennt kleine Viewports, auf denen Reveal deaktiviert bleibt
    function isSmallViewport() {
        return window.innerWidth <= MOBILE_MAX_WIDTH;
    }

    // berechnet die gedachte aktive Linie im aktuellen Viewport
    function getActiveLineY() {
        return window.innerHeight * ACTIVE_LINE_RATIO;
    }


    /* --------------------------- State Utilities --------------------------- */
    // setzt alle Reveal-Elemente sofort sichtbar
    function showAllItems() {
        items.forEach((item) => {
            item.classList.add("is-visible");
        });
    }

    // entfernt den Active-State von allen Projekt-Blöcken
    function clearActiveState() {
        items.forEach((item) => {
            item.classList.remove("is-active");
        });
    }

    // ermittelt den Projekt-Block, dessen Mittelpunkt der aktiven Linie am nächsten liegt
    function updateActiveItem() {
        if (!items.length) {
            return;
        }

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
    // erstellt einen Observer, der Projekt-Blöcke beim ersten Sichtbarwerden einblendet
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

    // registriert alle Reveal-Elemente beim Observer
    function registerRevealObserver() {
        const observer = createRevealObserver();

        items.forEach((item) => {
            observer.observe(item);
        });
    }


    /* --------------------------- Details Utilities --------------------------- */
    // setzt alle Zustandsklassen eines Detailbereichs zurück
    function resetDetailsState(details) {
        details.classList.remove("is-opening", "is-open", "is-closing");
    }

    // schreibt die aktuelle Inhaltshöhe als max-height inline, damit CSS sauber animieren kann
    function setExpandedHeight(content) {
        content.style.maxHeight = `${content.scrollHeight}px`;
    }

    // entfernt die Inline-Höhe nach Abschluss der Animation wieder
    function clearExpandedHeight(content) {
        content.style.maxHeight = "";
    }

    // öffnet einen Detailbereich weich
    function openDetails(details, content) {
        resetDetailsState(details);

        // native <details>-Struktur öffnen, bevor die Animation startet
        details.open = true;
        details.classList.add("is-opening");

        // Startwert für die Höhenanimation
        content.style.maxHeight = "0px";

        // im nächsten Frame auf die tatsächliche Höhe animieren
        window.requestAnimationFrame(() => {
            setExpandedHeight(content);
        });

        // nach Ablauf der Animation in den offenen Endzustand wechseln
        window.setTimeout(() => {
            details.classList.remove("is-opening");
            details.classList.add("is-open");
            setExpandedHeight(content);
        }, DETAILS_ANIMATION_DURATION);
    }

    // schließt einen Detailbereich weich
    function closeDetails(details, content) {
        resetDetailsState(details);

        details.classList.add("is-closing");

        // sicherstellen, dass vom aktuellen Inhaltshöhenwert aus animiert wird
        setExpandedHeight(content);

        // im nächsten Frame auf 0 zurückfahren
        window.requestAnimationFrame(() => {
            content.style.maxHeight = "0px";
        });

        // nach Ablauf der Animation den nativen Zustand schließen
        window.setTimeout(() => {
            details.open = false;
            resetDetailsState(details);
            clearExpandedHeight(content);
        }, DETAILS_ANIMATION_DURATION);
    }


    /* --------------------------- Event Binding: Details --------------------------- */
    // bindet die Interaktion an ein einzelnes <details>-Element
    function bindDetails(details) {
        const summary = details.querySelector(".projekt__summary");
        const content = details.querySelector(".projekt__details-content");

        if (!summary || !content) {
            return;
        }

        // Initialzustand korrekt setzen, falls ein Detailbereich bereits geöffnet ist
        if (details.open) {
            details.classList.add("is-open");
            setExpandedHeight(content);
        }

        summary.addEventListener("click", (event) => {
            // bei reduzierter Bewegung bleibt das native Browser-Verhalten aktiv
            if (shouldReduceMotion()) {
                return;
            }

            // natives sofortiges Öffnen/Schließen unterdrücken, damit die eigene Animation greifen kann
            event.preventDefault();

            // Mehrfachklicks während laufender Animation verhindern
            if (details.classList.contains("is-opening") || details.classList.contains("is-closing")) {
                return;
            }

            if (details.open) {
                closeDetails(details, content);
                return;
            }

            openDetails(details, content);
        });
    }

    // bindet alle gefundenen Detailbereiche
    function registerDetailsBindings() {
        detailsElements.forEach((details) => {
            bindDetails(details);
        });
    }

    // aktualisiert die Höhen aller aktuell geöffneten Detailbereiche, z. B. nach Resize
    function updateOpenDetailsHeights() {
        detailsElements.forEach((details) => {
            const content = details.querySelector(".projekt__details-content");

            if (!content) {
                return;
            }

            if (details.open && !details.classList.contains("is-closing")) {
                setExpandedHeight(content);
            }
        });
    }


    /* --------------------------- Event Binding: Scroll / Resize --------------------------- */
    function registerStateListeners() {
        // Active-State beim Scrollen aktualisieren
        window.addEventListener("scroll", updateActiveItem, { passive: true });

        // bei Größenänderung Active-State und offene Detailhöhen neu berechnen
        window.addEventListener("resize", updateActiveItem);
        window.addEventListener("resize", updateOpenDetailsHeights);

        // beim vollständigen Laden ebenfalls einmal sauber initialisieren
        window.addEventListener("load", updateActiveItem);
        window.addEventListener("load", updateOpenDetailsHeights);
    }


    /* --------------------------- Initialisierung --------------------------- */
    function init() {
        // Detail-Interaktionen immer registrieren, wenn passende Elemente vorhanden sind
        if (detailsElements.length) {
            registerDetailsBindings();
        }

        // ohne Reveal-Elemente ist keine weitere Scroll-Logik nötig
        if (!items.length) {
            return;
        }

        // auf kleinen Geräten oder bei reduzierter Bewegung: Inhalte sofort sichtbar setzen, Active-State aber beibehalten
        if (isSmallViewport() || shouldReduceMotion()) {
            showAllItems();
            registerStateListeners();
            updateActiveItem();
            updateOpenDetailsHeights();
            return;
        }

        // Reveal nur auf größeren Geräten ohne reduzierte Bewegung aktivieren
        registerRevealObserver();
        registerStateListeners();
        updateActiveItem();
        updateOpenDetailsHeights();
    }

    // das Script ist mit defer eingebungen & dadurch wird dieses Script erst nach dem Parsen des HTML ausgeführt
    init();
})();