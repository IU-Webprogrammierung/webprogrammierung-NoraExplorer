/*
    Lädt die Header-Komponente in #site-header nach und setzt anschließend:
    - aria-current="page" für den aktuellen Menüpunkt
    - initialisiert die Offcanvas-Navigation (initHeaderNav)

    - jQuery -> (für DOMReady & .load & Selektoren)
*/

$(function () {
    // Lädt die HTML-Komponente in #site-header 
    $("#site-header").load("components/header.html.component", function (_response, status) {
        // Defensive: Falls Laden fehlschlägt, abbrechen 
        if (status !== "success") return;

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
});