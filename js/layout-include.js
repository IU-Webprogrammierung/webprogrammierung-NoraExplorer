/*
    Lädt Header & Footer Komponenten nach

    Header: 
        - lädt components/header.html.component in #site-header
        - setzt aria-current="page" anhand Dateiname (data-page-mapping)
        - initialisiert die Offcanvas-Navigation (initHeaderNav)

    Footer: 
        - lädt components/footer.html.component in #site-footer

    Abhängigkeiten:
    - jQuery -> (für DOMReady & .load & Selektoren)
    - nav.js (stellt window.initHeaderNav bereit)
*/

(() => {
    "use strict";

    function init() {
        /* --------------------------- Header: laden & initialisieren --------------------------- */
        // Lädt die HTML-Komponente in #site-header 
        $("#site-header").load("components/header.html.component", function (_response, status) {
            // Defensive: Falls Laden fehlschlägt, abbrechen 
            if (status !== "success") {
                return;
            }

            // Aktuelle Datei ermitteln (& Fallback auf index.html)
            const file = window.location.pathname.split("/").pop() || "index.html";

            // Mapping: Dateiname -> data-page-key im HTML
            const map = {
                "index.html": "index",
                "ueber.html": "ueber",
                "fotografie.html": "fotografie",
                "projekte.html": "projekte",
                "prozess.html": "prozess"
            };

            // Passenden data-page Wert zur aktuellen Datei finden (wenn keine Zuordnung existiert wird key = undefined und es wird kein Active State gesetzt)
            const key = map[file];
    
            if (key) {
                // Active-State zurücksetzen (aria-current entfernen, is-active entfernen)
                $(".nav-link").removeAttr("aria-current").removeClass("is-active");

                // Passenden Link anhand des data-page Attributs selektieren & markieren
                $(`.nav-link[data-page="${key}"]`).attr("aria-current", "page").addClass("is-active");
            }

            // Offcanvas-Navigation initialisieren (wichtig: diese Funktion existiert in nav.js)
            if (typeof window.initHeaderNav === "function") {
                window.initHeaderNav();
            }
        });



        /* --------------------------- Footer: laden --------------------------- */
        $("#site-footer").load("components/footer.html.component", function (_response, status) {
            if (status !== "success") {
                return;
            }
        });
    }


    // das Script ist mit defer eingebungen & dadurch wird dieses Script erst nach dem Parsen des HTML ausgeführt
    init();
})();
