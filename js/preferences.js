/* 
    Zentrale User-Preferences:
        - Theme: light, dark, auto 
        - Font-Size: small, medium, large
        - Motion: reduced, full
*/

(() => {
    "use strict"; // strict mode (macht u.a. Fehlverhalten früher sichtbar) 

    /* --------------------------- Persistenz (localStorage) --------------------------- */
    const STORAGE_KEYS = {
        // Theme-Preferences: "light" "dark" "auto"
        theme: "pref_theme",

        // Font-Size-Preferences: "small" "medium" "large"
        fontSize: "pref_fontSize",

        // Motion Preferences: "reduced" "full" (wenn nicht gesetzt folgt es den System-Präferenzen)
        motion: "pref_motion"
    };


    /* --------------------------- DOM Referenzen --------------------------- */
    const root = document.documentElement;


    /* --------------------------- System Präferenzen (Media Queries über JS) --------------------------- */
    const mqlColorScheme = window.matchMedia?.("(prefers-color-scheme: dark)");
    const mqlReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");


    /* --------------------------- Safe localStorage Wrapper --------------------------- */
    const read = (key) => {
        try { 
            return localStorage.getItem(key); 
        } catch { 
            return null; // Fallback
        }
    };

    const write = (key, value) => {
        try { 
            localStorage.setItem(key, value); 
        } catch { 
            /* ignore: ohne Persistenz weiterlaufen */ 
        }
    };


    /* --------------------------- Theme Helfer --------------------------- */
    const getSystemTheme = () => (mqlColorScheme?.matches ? "dark" : "light"); 
    // wenn prefers-color-scheme: dark zutrifft -> "dark" ansonsten "light"


    /* --------------------------- Apply Functions (setzen data-Attribute bzw Theme setzen) --------------------------- */
    //Apply: Theme setzen
    function applyTheme(themePref) {
        // Theme-Preferences: "light" "dark" "auto"
        const theme = themePref || "auto";

        // Auto -> folgt Sytsme, ansonsten über direkte User-Wahl 
        const effectiveTheme = theme === "auto" ? getSystemTheme() : theme;

        // effektives Theme auf <html> schreiben (CSS liest html[data-theme="........""])
        root.setAttribute("data-theme", effectiveTheme);

        // data-theme auto (wenn USer "auto" gewählt hat)
        root.toggleAttribute("data-theme-auto", theme === "auto");
    }


    // Apply: Font-Size setzen
    function applyFontSize(sizePref) {
        // Font-Size-Preferences: "small" "medium" "large"
        const size = sizePref || "medium";
        // CSS nutzt html[data-font-size="......."] um --user-font-scale zu setzen
        root.setAttribute("data-font-size", size);
    }


    // Apply: Motion setzen
    function applyMotion(motionPref) {
        // Motion Preferences: "reduced" "full" (wenn nicht gesetzt folgt es den System-Präferenzen)

        // User Override: nur zwei gültige Werte zulassen
        if (motionPref === "reduced" || motionPref === "full") {
            root.setAttribute("data-motion", motionPref);
            return;
        }

        // Keine User-Entscheidung bzw kein User Override -> System preference übernehmen
        const systemReduced = !!mqlReducedMotion?.matches;
        root.setAttribute("data-motion", systemReduced ? "reduced" : "full");
    }


    /* --------------------------- Settings UI Sync (falls vorhanden) --------------------------- */
    function syncSettingsUI() {
        // Defaults, falls nichts gespeichert:
        const theme = read(STORAGE_KEYS.theme) || "auto";
        const fontSize = read(STORAGE_KEYS.fontSize) || "medium";
        const motion = read(STORAGE_KEYS.motion); // null oder "reduced"/"full"

        // Theme Radio selektieren
        const themeEl = document.querySelector(`input[name="theme"][value="${theme}"]`);
        if (themeEl) {
            themeEl.checked = true;
        }

        // Font-size Radio selektieren
        const sizeEl = document.querySelector(`input[name="text-size"][value="${fontSize}"]`);
        if (sizeEl) {
            sizeEl.checked = true;
        }

        // Checkbox 
        const reduceMotionCheckbox = document.getElementById("reduce-motion");
        if (reduceMotionCheckbox) {
            // Checkbox bedeutet: "Bewegungen reduzieren" -> motion="reduced"
            reduceMotionCheckbox.checked = motion === "reduced";
        }
    }


    /* --------------------------- Listener an Settings-Form binden --------------------------- */
    function bindSettingsListeners() {
        // theme Radios (light,dark,auto)
        document.querySelectorAll('input[name="theme"]').forEach((el) => {
            el.addEventListener("change", () => {
                if (!el.checked) {
                    return;
                }

                // Auswahl speichern & anwenden (speichert Auswahl in localStorage & wendet Änderung sofort an)
                write(STORAGE_KEYS.theme, el.value);
                applyTheme(el.value);
            });
        });

        // text-size Radios
        document.querySelectorAll('input[name="text-size"]').forEach((el) => {
            el.addEventListener("change", () => {
                if (!el.checked) {
                    return;
                }

                // Auswahl speichern & anwenden (speichert Auswahl in localStorage & wendet Änderung sofort an)
                write(STORAGE_KEYS.fontSize, el.value);
                applyFontSize(el.value);
            });
        });

        // reduce-motion checkbox
        const reduceMotion = document.getElementById("reduce-motion");
        if (reduceMotion) {
            reduceMotion.addEventListener("change", () => {
                if (reduceMotion.checked) {
                    // Checkbox an -> User Override: reduced

                    // Auswahl speichern & anwenden
                    write(STORAGE_KEYS.motion, "reduced");
                    applyMotion("reduced");
                } else {
                    // Checkbox aus -> Override entfernen, System Präferenz gilt wieder
                    try { 
                        localStorage.removeItem(STORAGE_KEYS.motion); 
                    } catch { 
                        /* ignore */ 
                    }
                    applyMotion(null);
                }
            });
        }
    }


    /* --------------------------- Init: Einstiegspunk (liest gespeicherte Werte & wendet sie an) --------------------------- */
    function init() {
        // gespeicherte Werte lesen (können null sein)
        const themePref = read(STORAGE_KEYS.theme);
        const fontSizePref = read(STORAGE_KEYS.fontSize);
        const motionPref = read(STORAGE_KEYS.motion);

        // auf <html> anwenden
        applyTheme(themePref);
        applyFontSize(fontSizePref);
        applyMotion(motionPref);

        // Reaktion auf Systemwechsel (nur wenn Theme auf auto steht)
        if (mqlColorScheme?.addEventListener) {
            // Für moderne Browser
            mqlColorScheme.addEventListener("change", () => {
                // Aktuelle User-Preference erneut lesen
                if ((read(STORAGE_KEYS.theme) || "auto") === "auto") {
                    applyTheme("auto"); // setzt data-theme passend zum aktuellen System
                }
            });
        } else if (mqlColorScheme?.addListener) {
            // Legacy Fallback für ältere Browser
            mqlColorScheme.addListener(() => {
                if ((read(STORAGE_KEYS.theme) || "auto") === "auto") {
                    applyTheme("auto");
                }
            });
        }

        // Reagiere auf System Motion (nur wenn Nutzer nichts gesetzt hat)
        if (mqlReducedMotion?.addEventListener) {
            mqlReducedMotion.addEventListener("change", () => {
                const pref = read(STORAGE_KEYS.motion);
                if (!pref) {
                    applyMotion(null);
                }
            });
        } else if (mqlReducedMotion?.addListener) {
            mqlReducedMotion.addListener(() => {
                const pref = read(STORAGE_KEYS.motion);
                if (!pref) {
                    applyMotion(null);
                }
            });
        }

        // Falls wir auf der Einstellungsseite sind: UI sync + Listener
        syncSettingsUI();
        bindSettingsListeners();
    }


    /* 
        Ohne defer müsste die Initialisierung an DOMContentLoaded gebunden werden, 
        da das Script sonst vor dem vollständigen DOM-Aufbau ausgeführt werden könnte 
        -> document.addEventListener("DOMContentLoaded", init); 
    */
    init(); 
    // das Script ist mit defer eingebunden & dadurch ist das DOM beim ausführen bereits vollständig geparst
})();