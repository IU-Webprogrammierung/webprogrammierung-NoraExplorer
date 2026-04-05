/*
    Interaktionsverhalten für die Fotogalerie:
        - öffnet Galerie-Bilder in einer Lightbox
        - übernimmt Bildquelle und Alternativtext in die vergrößerte Ansicht
        - positioniert den Close-Button auf größeren Geräten abhängig von der tatsächlichen Bildgröße
        - nutzt auf kleinen Geräten einen festen Close-Button oben rechts
        - stellt den Tastaturfokus nach dem Schließen wieder auf das auslösende Bild zurück
        - schließt die Lightbox per Close-Button, Overlay-Klick oder Escape-Taste
*/

(() => {
    "use strict";

    /* --------------------------- Konfiguration --------------------------- */
    const MOBILE_MAX_WIDTH = 767;
    const CLOSE_BUTTON_GAP = 12;
    const VIEWPORT_PADDING = 12;


    /* --------------------------- DOM Referenzen --------------------------- */
    const images = Array.from(
        document.querySelectorAll(".detailseite.seite-fotografie .galerie__media img")
    );

    const lightbox = document.getElementById("lightbox");
    const lightboxImg = lightbox?.querySelector(".lightbox__img");
    const closeButton = lightbox?.querySelector(".lightbox__close");


    /* --------------------------- State --------------------------- */
    let lastTriggerImage = null;


    /* --------------------------- State Utilities --------------------------- */
    // Prüft, ob alle für die Lightbox nötigen DOM-Elemente vorhanden sind
    function hasRequiredElements() {
        return !!lightbox && !!lightboxImg && !!closeButton && images.length > 0;
    }


    /* --------------------------- Viewport Utilities --------------------------- */
    // Prüft, ob aktuell ein kleiner Bildschirm aktiv ist
    function isSmallViewport() {
        return window.innerWidth <= MOBILE_MAX_WIDTH;
    }


    /* --------------------------- Lightbox Utilities --------------------------- */
    // Positioniert den Close-Button abhängig vom verfügbaren Platz am Bild, ohne dass er in das Bild hineinragt
    function positionCloseButton() {
        const imageRect = lightboxImg.getBoundingClientRect();
        const buttonRect = closeButton.getBoundingClientRect();

        const maxTop = window.innerHeight - buttonRect.height - VIEWPORT_PADDING;
        const maxLeft = window.innerWidth - buttonRect.width - VIEWPORT_PADDING;

        // auf kleinen Geräten festen Button oben rechts im Viewport nutzen
        if (isSmallViewport()) {
            closeButton.style.top = `${VIEWPORT_PADDING}px`;
            closeButton.style.right = `${VIEWPORT_PADDING}px`;
            closeButton.style.left = "";
            return;
        }

        const rightSideLeft = imageRect.right + CLOSE_BUTTON_GAP;
        const alignedTop = Math.max(VIEWPORT_PADDING, Math.min(imageRect.top, maxTop));

        // Standardfall: genug Platz rechts neben dem Bild
        if (rightSideLeft <= maxLeft) {
            closeButton.style.top = `${alignedTop}px`;
            closeButton.style.left = `${rightSideLeft}px`;
            closeButton.style.right = "";
            return;
        }

        // Fallback: oberhalb des Bildes, rechts an der Bildkante ausgerichtet
        const aboveTop = imageRect.top - buttonRect.height - CLOSE_BUTTON_GAP;
        const alignedRightLeft = imageRect.right - buttonRect.width;

        closeButton.style.top = `${Math.max(VIEWPORT_PADDING, aboveTop)}px`;
        closeButton.style.left = `${Math.max(VIEWPORT_PADDING, Math.min(alignedRightLeft, maxLeft))}px`;
        closeButton.style.right = "";
    }

    // Setzt die Inline-Position des Close-Buttons zurück
    function resetCloseButtonPosition() {
        closeButton.style.top = "";
        closeButton.style.right = "";
        closeButton.style.left = "";
    }

    // Öffnet die Lightbox mit dem angeklickten Bild
    function openLightbox(image) {
        lastTriggerImage = image;

        lightboxImg.src = image.src;
        lightboxImg.alt = image.alt;

        lightbox.classList.add("is-open");
        lightbox.setAttribute("aria-hidden", "false");

        closeButton.focus();

        // Position erst berechnen, wenn das Bild in der Lightbox geladen ist
        lightboxImg.onload = () => {
            positionCloseButton();
        };
    }

    // Schließt die Lightbox und setzt den Bildzustand zurück
    function closeLightbox() {
        lightbox.classList.remove("is-open");
        lightbox.setAttribute("aria-hidden", "true");

        lightboxImg.src = "";
        lightboxImg.alt = "";
        lightboxImg.onload = null;

        resetCloseButtonPosition();

        if (lastTriggerImage) {
            lastTriggerImage.focus();
            lastTriggerImage = null;
        }
    }


    /* --------------------------- Event Handler --------------------------- */
    // Reagiert auf Klick auf ein Galerie-Bild
    function handleImageClick(image) {
        openLightbox(image);
    }

    // Reagiert auf Klick auf den Close-Button
    function handleCloseClick() {
        closeLightbox();
    }

    // Schließt die Lightbox bei Klick auf das Overlay außerhalb des Bildes
    function handleOverlayClick(event) {
        if (event.target !== lightbox) {
            return;
        }

        closeLightbox();
    }

    // Schließt die Lightbox per Escape-Taste
    function handleKeydown(event) {
        if (event.key !== "Escape") {
            return;
        }

        if (!lightbox.classList.contains("is-open")) {
            return;
        }

        closeLightbox();
    }

    // Aktualisiert die Button-Position bei Größenänderung des Viewports
    function handleResize() {
        if (!lightbox.classList.contains("is-open")) {
            return;
        }

        positionCloseButton();
    }


    /* --------------------------- Event Listener --------------------------- */
    // Registriert alle benötigten Event Listener
    function registerListeners() {
        images.forEach((image) => {
            image.addEventListener("click", () => {
                handleImageClick(image);
            });

            image.addEventListener("keydown", (event) => {
                if (event.key !== "Enter" && event.key !== " ") {
                    return;
                }

                event.preventDefault();
                handleImageClick(image);
            });
        });

        closeButton.addEventListener("click", handleCloseClick);

        lightbox.addEventListener("click", (event) => {
            handleOverlayClick(event);
        });

        document.addEventListener("keydown", (event) => {
            handleKeydown(event);
        });

        window.addEventListener("resize", handleResize);
    }


    /* --------------------------- Initialisierung --------------------------- */
    function init() {
        // Script nur ausführen, wenn alle benötigten Elemente vorhanden sind
        if (!hasRequiredElements()) {
            return;
        }

        registerListeners();
    }

    // das Script ist mit defer eingebunden & dadurch wird dieses Script erst nach dem Parsen des HTML ausgeführt
    init();
})();