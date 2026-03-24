/*
    Dynamischer Favicon-Wechsel, abhängig vom Farbschema des Users 
*/

(() => {
    "use strict";

    /* --------------------------- Konfuguration --------------------------- */
    const ICON_LIGHT = "favicon.ico"; // Favicon für Light-Mode 
    const ICON_DARK = "images/ui/favicon-dark-mode.ico"; // Favicon für Dark-Mode

    // Bei Favicon-Änderungen hochzählen
    const FAVICON_VERSION = "1";

    /* --------------------------- Initialisierung (Init: Einstiegspunk des Sktipts) --------------------------- */
    function init() {

        // Guard Clause: matchMedia muss vorhanden sein (sonst kein prefers-color-scheme)
        if (!supportsColorScheme()) {
            return;
        }

        // setzt das initiale Favicon passend zum aktuellen Farbschema
        updateFavicon();

        // Listener registrieren für spätere Änderungen 
        registerListeners();
    }


    /* --------------------------- Feature Detection --------------------------- */
    // Prüft, ob prefers-color-scheme (über matchMedia) unterstützt wird
    function supportsColorScheme() {
        return typeof window.matchMedia === "function";
    }


    /* --------------------------- Core Logik --------------------------- */
    // Ermittelt das aktuelle Farbschema und setzt das entsprechende Favicon
    function updateFavicon() {

        // Media Query auswerten (wenn true ist Dark mode aktiv)
        //const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

        const isDarkModeActive = window.matchMedia("(prefers-color-scheme: dark)").matches;

        let faviconPath;

        if (isDarkModeActive) {
            faviconPath = ICON_DARK;
        } else {
            faviconPath = ICON_LIGHT;
        }

        // Bestehende Favicons entfernen (verhindert Konflikte und verbessert die Cache-Situation)
        removeExistingFavicons();

        // Neues Favicon in <head> einfügen
        appendFaviconLink(faviconPath);
        
    }

     
    /* --------------------------- DOM Utilities --------------------------- */
    // entfernt alle bestehenden Favicon-Links aus dem Dokument
    function removeExistingFavicons() {
        document.querySelectorAll('link[rel~="icon"]').forEach((faviconLink) => {
            faviconLink.remove();
        });
    }

    // Erstellt ein neues <link rel="icon">-Element und fügt es dem <head> hinzu
    function appendFaviconLink(faviconPath) {

        //neues Link-Element erzeugen
        const link = document.createElement("link");

        // Attribut-Konfiguration
        link.rel = "icon";
        link.type = "image/x-icon";
        link.sizes = "any";

        // Versionierter Cache-Buster: Browser darf cachen, Updates sind kontrollierbar
        link.href = `${faviconPath}?v=${FAVICON_VERSION}`;

        // Element in <head> einfügen
        document.head.appendChild(link);
    }


    /* --------------------------- Event Listener --------------------------- */
    // Registriert Listener für Änderungen des Farbschemas
    function registerListeners() {

        // MediaQueryList-Objekt erzeugen
        const query = window.matchMedia("(prefers-color-scheme: dark)");

        // Moderne Browser
        if (typeof query.addEventListener === "function") {
            query.addEventListener("change", updateFavicon);
        }
         // Fallback für ältere Browser
        else if (typeof query.addListener === "function") {
            query.addListener(updateFavicon);
        }
    }

    // das Script ist mit defer eingebungen & dadurch wird dieses Script erst nach dem Parsen des HTML ausgeführt
    init();
})();
