/* 
    Mobile Offcanvas-Navigation (Header)
    - Öffnet/Schließt Panel & Overlay (aside#mobileNav und div#navOverlay)
    - Setzt Aria-Attribute korrekt (aria-expanded, aria hidden, aria-label)
    - Fokus-Management für Accessibility
    - ESC schließt das Menü

    Hinweis: diese Funktion wird aus header-include.js nachgeladen, weil der Header dynamisch mit .load() in die Seite eingefügt wird
*/

/* --------------------------- Globale Initialisierungs-Funktion --------------------------- */
window.initHeaderNav = function initHeaderNav() {
    // DOM-Referenzen (Elemente, die das Offcanvas steuern)
    const toggleBtn = document.getElementById("navToggle");
    const mobileNav = document.getElementById("mobileNav");
    const overlay = document.getElementById("navOverlay");
    const closeBtn = mobileNav?.querySelector("[data-nav-close]");

    // Guard Clause 
    if (!toggleBtn || !mobileNav || !overlay || !closeBtn) return;

    // 
    let lastActiveElement = null;


    /* --------------------------- Initialzustand: Menü geschlossen (Sichtbarkeit & aria) --------------------------- */
    overlay.hidden = true;
    mobileNav.hidden = true;

    // aria-hidden: Screenreader sollen Overlay/Panel ignorieren, solange es geschlossen ist
    overlay.setAttribute("aria-hidden", "true");
    mobileNav.setAttribute("aria-hidden", "true");

    // aria-expanded: Zustand des Toggle-Buttons ist geschlossen
    toggleBtn.setAttribute("aria-expanded", "false");


    /* --------------------------- Fokus-Utilities --------------------------- */
    // CSS-Selektor für Elemente, die per Tastatur fokussierbar sind
    const focusableSelector =
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

    // Liefert alle fokussierbaren Elemente innerhalb eines Containers und filtert disabled Elemente sowie aria-hidden="true" raus
    const getFocusable = (root) =>
        [...root.querySelectorAll(focusableSelector)].filter(
            (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
        );

    // Prüft, ob Offcanvas aktuell offen ist
    const isOpen = () => document.body.classList.contains("nav-open");


    /* --------------------------- Open/Close Logik --------------------------- */
    // Öffnet das Offcanvas Menü
    const openNav = () => {
        if (isOpen()) return;

        // Fokusposition vor Öffnen merken
        lastActiveElement = document.activeElement;

        // CSS-State aktivieren
        document.body.classList.add("nav-open");

        // Panel/Overlay sichtbar machen
        overlay.hidden = false;
        mobileNav.hidden = false;

        // ARIA: offen
        overlay.setAttribute("aria-hidden", "false");
        mobileNav.setAttribute("aria-hidden", "false");
        toggleBtn.setAttribute("aria-expanded", "true");
        toggleBtn.setAttribute("aria-label", "Menü schließen");

        // Fokus ins Panel setzen
        const focusables = getFocusable(mobileNav);
        (focusables[0] || closeBtn).focus();
    };


    // Schließt das Offcanvas Menü
    const closeNav = () => {
        if (!isOpen()) return;

        // CSS-State dektivieren
        document.body.classList.remove("nav-open");

        // ARIA: geschlossen
        toggleBtn.setAttribute("aria-expanded", "false");
        toggleBtn.setAttribute("aria-label", "Menü öffnen");
        overlay.setAttribute("aria-hidden", "true");
        mobileNav.setAttribute("aria-hidden", "true");

        // Panel/Overlay verstecken
        overlay.hidden = true;
        mobileNav.hidden = true;

        //Fokus zurückgeben (wenn möglich), ansonsten auf Toggle-Button
        const target = lastActiveElement && typeof lastActiveElement.focus === "function"
            ? lastActiveElement
            : toggleBtn;

        target.focus();
    };


    /* --------------------------- Event Handler --------------------------- */
    // Toggle Button 
    toggleBtn.addEventListener("click", () => {
        isOpen() ? closeNav() : openNav();
    });

    // Close-Button und Overlay
    closeBtn.addEventListener("click", closeNav);
    overlay.addEventListener("click", closeNav);

    // Tastatursteuerung 
    document.addEventListener("keydown", (e) => {
        if (!isOpen()) return;

        // Esc schließt das Menü
        if (e.key === "Escape") {
            e.preventDefault();
            closeNav();
            return;
        }

        // Tab als Focus Trap (Fokus innerhalb des Pannels)
        if (e.key === "Tab") {
            const focusables = getFocusable(mobileNav);
            if (focusables.length === 0) return;

            const first = focusables[0];
            const last = focusables[focusables.length - 1];

            // Shift+Tab am ersten Element -> springt zum letzten
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            //Tab am letzten Element -> springt zum ersten
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });

    // Klick auf einen Link im Panel
    mobileNav.addEventListener("click", (e) => {
        const link = e.target.closest("a[href]");
        if (link) closeNav();
    });

    // Responsive: wenn auf Desktop gewechselt wird, schließt das Mobile Panel
    window.addEventListener("resize", () => {
        if (window.matchMedia("(min-width: 1024px)").matches) {
            closeNav();
        }
    });

    // Klick außerhalb (zusätzlich zum Overlay): Defensive UX (schließt auch, falls das Overlay nicht greift)
    document.addEventListener("click", (e) => {
        if (!isOpen()) return;

        const clickedInsideNav = mobileNav.contains(e.target);
        const clickedToggle = toggleBtn.contains(e.target);

        if (!clickedInsideNav && !clickedToggle) {
            closeNav();
        }
    });
};