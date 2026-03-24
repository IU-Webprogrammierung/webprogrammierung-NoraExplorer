/*
    Mobile Offcanvas-Navigation (Header)
        - Öffnet/Schließt Panel & Overlay
        - Pflegt Zustände für Sichtbarkeit, ARIA und Fokus
        - Enthält Focus-Trap für Tastaturbedienung
        - Schließt per ESC, Overlay-Klick, Link-Klick und Breakpoint-Wechsel

    Hinweis:
        - Diese Funktion wird aus layout-include.js nachgeladen, weil der Header dynamisch in die Seite eingefügt wird.
*/

window.initHeaderNav = function initHeaderNav() {
    /* --------------------------- DOM-Referenzen --------------------------- */
    const toggleBtn = document.getElementById("navToggle");
    const mobileNav = document.getElementById("mobileNav");
    const overlay = document.getElementById("navOverlay");
    const closeBtn = mobileNav?.querySelector("[data-nav-close]");

    /* --------------------------- Guard Clauses --------------------------- */
    // Bricht ab, wenn zentrale Header-Elemente im DOM nicht vorhanden sind
    if (!toggleBtn || !mobileNav || !overlay || !closeBtn) {
        return;
    }

    // Verhindert doppelte Initialisierung, falls der Header erneut geladen wird
    if (mobileNav.dataset.navInitialized === "true") {
        return;
    }
    mobileNav.dataset.navInitialized = "true";

    /* --------------------------- Konfiguration --------------------------- */
    // Breakpoint für Wechsel von Mobile-Navigation zu Desktop-Navigation
    const DESKTOP_BREAKPOINT = "(min-width: 1024px)";
    const desktopMediaQuery = window.matchMedia(DESKTOP_BREAKPOINT);

    // CSS-Selektor für potenziell fokussierbare Elemente innerhalb des Panels
    const FOCUSABLE_SELECTOR = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(", ");

    const CLOSE_TRANSITION_FALLBACK_MS = 300;

    /* --------------------------- Interner Zustand --------------------------- */
    // Speichert das zuletzt aktive Element vor dem Öffnen des Menüs
    let lastActiveElement = null;

    // Speichert eine Fallback-Timeout-ID für das Schließen, falls transitionend nicht ausgelöst wird
    let closeTransitionFallbackId = null;

    /* --------------------------- Fokus-Utilities --------------------------- */
    // Prüft, ob ein Element im Layout sichtbar und sinnvoll fokussierbar ist
    function isElementVisible(element) {
        return Boolean(
            element &&
            !element.hidden &&
            element.getAttribute("aria-hidden") !== "true" &&
            element.offsetParent !== null
        );
    }

    // Liefert alle tatsächlich nutzbaren Fokusziele innerhalb eines Containers
    function getFocusableElements(root) {
        return [...root.querySelectorAll(FOCUSABLE_SELECTOR)].filter((element) => {
            return (
                !element.hasAttribute("disabled") &&
                !element.hasAttribute("inert") &&
                element.getAttribute("aria-hidden") !== "true" &&
                isElementVisible(element)
            );
        });
    }

    // Prüft, ob die Mobile-Navigation aktuell geöffnet ist
    function isNavOpen() {
        return document.body.classList.contains("nav-open");
    }

    // Setzt den Fokus nach dem Öffnen auf das erste sinnvolle Element im Panel
    function focusInitialElement() {
        const focusableElements = getFocusableElements(mobileNav);
        const initialFocusTarget = focusableElements[0] || closeBtn;

        initialFocusTarget.focus();
    }

    // Gibt den Fokus beim Schließen an das zuvor aktive Element zurück. Fallback ist der Toggle-Button
    function restoreFocus() {
        const focusTarget =
            lastActiveElement instanceof HTMLElement &&
            typeof lastActiveElement.focus === "function"
                ? lastActiveElement
                : toggleBtn;

        focusTarget.focus();
    }

    /* --------------------------- State-Utilities --------------------------- */
    // Entfernt ein laufendes Fallback-Timeout für den Schließvorgang
    function clearCloseFallback() {
        if (closeTransitionFallbackId !== null) {
            window.clearTimeout(closeTransitionFallbackId);
            closeTransitionFallbackId = null;
        }
    }

    // Setzt den vollständig geschlossenen Zustand
    function setClosedState() {
        document.body.classList.remove("nav-open");

        toggleBtn.setAttribute("aria-expanded", "false");
        toggleBtn.setAttribute("aria-label", "Menü öffnen");

        overlay.hidden = true;
        overlay.setAttribute("aria-hidden", "true");

        mobileNav.hidden = true;
        mobileNav.setAttribute("aria-hidden", "true");
        mobileNav.setAttribute("inert", "");
    }

    // Setzt den geöffneten Zustand initial
    // Die Klasse nav-open wird im nächsten Frame ergänzt, damit CSS-Transitionen sauber anlaufen
    function setOpenState() {
        overlay.hidden = false;
        overlay.setAttribute("aria-hidden", "false");

        mobileNav.hidden = false;
        mobileNav.removeAttribute("inert");
        mobileNav.setAttribute("aria-hidden", "false");

        toggleBtn.setAttribute("aria-expanded", "true");
        toggleBtn.setAttribute("aria-label", "Menü schließen");

        requestAnimationFrame(() => {
            document.body.classList.add("nav-open");
            focusInitialElement();
        });
    }

    /* --------------------------- Open/Close-Logik --------------------------- */
    // Öffnet die Mobile-Navigation
    function openNav() {
        if (isNavOpen()) {
            return;
        }

        // Fokusposition vor dem Öffnen sichern
        lastActiveElement = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : toggleBtn;

        clearCloseFallback();
        setOpenState();
    }

    // Schließt die Mobile-Navigation
    // restoreFocusToTrigger:
    // - true: Fokus wird zurückgegeben
    // - false: kein Fokus-Restore, z. B. bei Linknavigation oder Breakpoint-Wechsel
    function closeNav({ restoreFocusToTrigger = true } = {}) {
        const wasOpen = isNavOpen();

        clearCloseFallback();

        // Semantischen Schließzustand sofort setzen; 
        // die finale Sichtbarkeit wird nach der Transition abgeschlossen
        document.body.classList.remove("nav-open");

        toggleBtn.setAttribute("aria-expanded", "false");
        toggleBtn.setAttribute("aria-label", "Menü öffnen");

        overlay.setAttribute("aria-hidden", "true");
        mobileNav.setAttribute("aria-hidden", "true");
        mobileNav.setAttribute("inert", "");

        const finishClose = () => {
            clearCloseFallback();

            overlay.hidden = true;
            mobileNav.hidden = true;

            if (restoreFocusToTrigger) {
                restoreFocus();
            }
        };

        // Falls bereits kein offener Zustand vorliegt: 
        // direkt finalisieren
        if (!wasOpen) {
            finishClose();
            return;
        }

        // Wartet gezielt auf das Ende der transform-Transition des Panels
        const handleTransitionEnd = (event) => {
            if (event.target !== mobileNav || event.propertyName !== "transform") {
                return;
            }

            mobileNav.removeEventListener("transitionend", handleTransitionEnd);
            finishClose();
        };

        mobileNav.addEventListener("transitionend", handleTransitionEnd);

        // Fallback: schließt auch dann sauber ab, wenn transitionend nicht ausgelöst wird
        closeTransitionFallbackId = window.setTimeout(() => {
            mobileNav.removeEventListener("transitionend", handleTransitionEnd);
            finishClose();
        }, CLOSE_TRANSITION_FALLBACK_MS);
    }

    // Schaltet zwischen offenem und geschlossenem Zustand um
    function toggleNav() {
        if (isNavOpen()) {
            closeNav();
            return;
        }

        openNav();
    }

    /* --------------------------- Event-Handler --------------------------- */
    function handleToggleClick() {
        toggleNav();
    }

    function handleCloseClick() {
        closeNav();
    }

    function handleOverlayClick() {
        closeNav();
    }

    // Klick auf Navigationslink im Panel: 
    // Menü schließen, aber Fokus nicht künstlich zurücksetzen, da in der Regel eine Seiten-Navigation folgt
    function handleNavClick(event) {
        const link = event.target.closest("a[href]");

        if (!link) {
            return;
        }

        closeNav({ restoreFocusToTrigger: false });
    }

    // Tastatursteuerung für ESC und Focus-Trap
    function handleDocumentKeydown(event) {
        if (!isNavOpen()) {
            return;
        }

        // ESC schließt das Menü
        if (event.key === "Escape") {
            event.preventDefault();
            closeNav();
            return;
        }

        // Nur Tab wird für Focus-Trap weiter verarbeitet
        if (event.key !== "Tab") {
            return;
        }

        const focusableElements = getFocusableElements(mobileNav);

        // Falls kein fokussierbares Element vorhanden ist: 
        // Fokus auf den Schließen-Button erzwingen
        if (focusableElements.length === 0) {
            event.preventDefault();
            closeBtn.focus();
            return;
        }

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;

        // Falls der Fokus aus dem Panel herausfällt:
        // zurück auf das erste Fokusziel holen
        if (!mobileNav.contains(activeElement)) {
            event.preventDefault();
            firstFocusable.focus();
            return;
        }

        // Shift+Tab am ersten Element -> springt zum letzten
        if (event.shiftKey && activeElement === firstFocusable) {
            event.preventDefault();
            lastFocusable.focus();
            return;
        }

        // Tab am letzten Element -> springt zum ersten
        if (!event.shiftKey && activeElement === lastFocusable) {
            event.preventDefault();
            firstFocusable.focus();
        }
    }

    // Schließt das Mobile-Panel beim Wechsel auf Desktop-Breakpoint
    function handleBreakpointChange(event) {
        if (event.matches) {
            closeNav({ restoreFocusToTrigger: false });
        }
    }

    /* --------------------------- Initialzustand --------------------------- */
    setClosedState();

    /* --------------------------- Listener registrieren --------------------------- */
    toggleBtn.addEventListener("click", handleToggleClick);
    closeBtn.addEventListener("click", handleCloseClick);
    overlay.addEventListener("click", handleOverlayClick);
    mobileNav.addEventListener("click", handleNavClick);
    document.addEventListener("keydown", handleDocumentKeydown);

    if (typeof desktopMediaQuery.addEventListener === "function") {
        desktopMediaQuery.addEventListener("change", handleBreakpointChange);
    } else if (typeof desktopMediaQuery.addListener === "function") {
        // Fallback für ältere Browser
        desktopMediaQuery.addListener(handleBreakpointChange);
    }
};