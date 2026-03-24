/*
    Lädt Header- und Footer-Komponenten nach

    Header:
        - lädt components/header.html.component in #site-header
        - setzt aria-current="page" anhand des Dateinamens
        - initialisiert die Offcanvas-Navigation (initHeaderNav)

    Footer:
        - lädt components/footer.html.component in #site-footer

    Abhängigkeiten:
        - jQuery
        - nav.js (stellt window.initHeaderNav bereit)
*/

(() => {
    "use strict";

    /* --------------------------- Seitenerkennung --------------------------- */
    // Ermittelt anhand des aktuellen Dateinamens den internen Seiten-Key, der im Header über data-page verwendet wird
    function getCurrentPageKey() {
        const fileName = window.location.pathname.split("/").pop() || "index.html";

        const pageMap = {
            "index.html": "index",
            "ueber.html": "ueber",
            "fotografie.html": "fotografie",
            "projekte.html": "projekte",
            "prozess.html": "prozess",
            "fotodesign-thaddy.html": "projekte",
            "brutzel.html": "projekte",
            "ananas-matheinsel.html": "projekte"
        };

        return pageMap[fileName] || null;
    }

    // Markiert die aktuell aktive Seite im geladenen Header. Setzt dazu aria-current="page" und ergänzt optional die CSS-Klasse is-active
    function markCurrentPage($root) {
        const currentPageKey = getCurrentPageKey();

        if (!currentPageKey) {
            return;
        }

        // Vorhandene aktive Zustände zurücksetzen
        $root.find("[data-page]")
            .removeAttr("aria-current")
            .removeClass("is-active");

        // Aktuelle Seite markieren
        $root.find(`[data-page="${currentPageKey}"]`)
            .attr("aria-current", "page")
            .addClass("is-active");
    }

    /* --------------------------- Initialisierung --------------------------- */
    function init() {
        const $header = $("#site-header");
        const $footer = $("#site-footer");

        // Bricht ab, wenn Header- oder Footer-Slot auf der Seite fehlt
        if (!$header.length || !$footer.length) {
            return;
        }

        // Basis-Pfade für Komponenten: können pro Seite via data-include-base angepasst werden
        const headerBase = $header.attr("data-include-base") || ".";
        const footerBase = $footer.attr("data-include-base") || ".";

        const headerPath = `${headerBase}/components/header.html.component`;
        const footerPath = `${footerBase}/components/footer.html.component`;

        /* --------------------------- Header laden --------------------------- */
        $header.load(headerPath, function (_response, status) {
            if (status !== "success") {
                console.error(`Header konnte nicht geladen werden: ${headerPath}`);
                return;
            }

            // Aktive Seite im nachgeladenen Header markieren
            markCurrentPage($header);

            // Mobile-Navigation initialisieren, sobald der Header im DOM steht
            if (typeof window.initHeaderNav === "function") {
                window.initHeaderNav();
            }
        });

        /* --------------------------- Footer laden --------------------------- */
        $footer.load(footerPath, function (_response, status) {
            if (status !== "success") {
                console.error(`Footer konnte nicht geladen werden: ${footerPath}`);
            }
        });
    }

    // das Script ist mit defer eingebungen & dadurch wird dieses Script erst nach dem Parsen des HTML ausgeführt
    init();
})();