// ============================================================
// Chess.com → Lichess Analysis Extension
//
// On chess.com: injects a "Lichess Analysis" button. On click,
// opens the share menu, reads the PGN, and opens lichess.org/paste.
//
// On lichess.org/paste: if the URL hash contains PGN data,
// auto-fills the form and submits it.
// ============================================================

(function () {
    var host = window.location.hostname;

    if (host.includes("lichess.org")) {
        handleLichessPaste();
        return;
    }

    if (host.includes("chess.com") && typeof document.arrive === "function") {
        watchForReviewButton();
        watchForMiniButton();
    }

    // ── Lichess: auto-fill /paste form ──────────────────────

    function handleLichessPaste() {
        var hash = window.location.hash;
        if (!hash || !hash.startsWith("#pgn=")) return;

        var pgn = decodeURIComponent(hash.substring(5));
        if (!pgn) return;

        var attempts = 0;
        var interval = setInterval(function () {
            attempts++;
            var textarea = document.querySelector('textarea[name="pgn"]');
            var submit = document.querySelector("button.submit") ||
                document.querySelector('form button[type="submit"]') ||
                document.querySelector(".submit");

            if (textarea && submit) {
                clearInterval(interval);
                var setter = Object.getOwnPropertyDescriptor(
                    window.HTMLTextAreaElement.prototype, "value"
                ).set;
                setter.call(textarea, pgn);
                textarea.dispatchEvent(new Event("input", { bubbles: true }));

                var analyse = document.querySelector('input[name="analyse"]');
                if (analyse && !analyse.checked) analyse.click();

                submit.click();
            }
            if (attempts > 30) clearInterval(interval);
        }, 400);
    }

    // ── Chess.com: watch for review button & inject ─────────

    var MARKER = "data-lichess-injected";
    var MINI_MARKER = "data-lichess-mini-injected";

    function watchForReviewButton() {
        // Current UI (2024+): button with data-cy="sidebar-game-review-button"
        document.arrive('a[data-cy="sidebar-game-review-button"]', { existing: true }, function (reviewBtn) {
            var container = reviewBtn.parentNode;
            if (!container || container.getAttribute(MARKER)) return;
            container.setAttribute(MARKER, "1");
            Arrive.unbindAllArrive();
            injectButton(container, reviewBtn);
            watchForReviewButton();
        });

        // Also watch game-over modal buttons (shown right after a game ends)
        document.arrive(".game-over-modal-buttons", { existing: true }, function (modal) {
            if (modal.getAttribute(MARKER)) return;
            modal.setAttribute(MARKER, "1");
            Arrive.unbindAllArrive();
            injectButton(modal, null);
            watchForReviewButton();
        });

        // Legacy UI fallback
        document.arrive(".game-review-buttons-component", { existing: true }, function (container) {
            if (container.getAttribute(MARKER)) return;
            var existing = container.querySelector('a[data-cy="sidebar-game-review-button"]');
            if (existing) return; // already handled above
            container.setAttribute(MARKER, "1");
            Arrive.unbindAllArrive();
            injectButton(container, null);
            watchForReviewButton();
        });
    }

    function watchForMiniButton() {
        // Mini button next to the share icon in the sidebar (live game + review)
        document.arrive('[data-cy="sidebar-share-icon"]', { existing: true }, function (shareBtn) {
            var container = shareBtn.parentNode;
            if (!container || container.getAttribute(MINI_MARKER)) return;
            container.setAttribute(MINI_MARKER, "1");
            injectMiniButton(container, shareBtn);
        });
    }

    function injectButton(container, referenceBtn) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.id = "lichess-analysis-button";
        btn.textContent = "Lichess Analysis";
        btn.className = "cc-button-component cc-button-primary cc-button-xx-large cc-bg-primary cc-button-full shine-hope-anim";
        btn.style.cssText = "margin-top:8px;cursor:pointer;border:none;width:100%;position:relative;overflow:hidden;";
        btn.addEventListener("click", sendToLichess);
        container.appendChild(btn);
    }

    function injectMiniButton(container, referenceBtn) {
        var mini = document.createElement("button");
        mini.type = "button";
        mini.id = "lichess-mini-analysis-button";
        mini.className = "cc-button-component cc-bg-primary shine-hope-anim button-class";
        mini.style.cssText = "margin-left:4px;width:32px;height:32px;border-radius:16px;padding:0;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;border:none;position:relative;overflow:hidden;";
        mini.setAttribute("aria-label", "Send current game to Lichess analysis");
        mini.addEventListener("click", sendToLichess);

        if (referenceBtn && referenceBtn.parentNode === container && referenceBtn.nextSibling) {
            container.insertBefore(mini, referenceBtn.nextSibling);
        } else {
            container.appendChild(mini);
        }
    }

    // ── Chess.com: get PGN via share menu → open Lichess ────

    function getCurrentPgnViaShareMenu() {
        var shareBtn = document.querySelector('[data-cy="sidebar-share-icon"]');
        if (!shareBtn) {
            alert("Could not find the share button on the page.");
            return null;
        }
        shareBtn.click();

        return waitForEl(".share-menu-tab-image-component", 8000)
            .then(function () {
                var tabPgn = document.getElementById("tab-pgn");
                if (tabPgn) tabPgn.click();
                return waitForEl(".share-menu-tab-pgn-textarea", 8000);
            })
            .then(function (textarea) {
                var pgn = textarea.value;
                closeShareMenu();
                if (!pgn) {
                    alert("Could not read the PGN from the game.");
                    return null;
                }
                return pgn;
            })
            .catch(function () {
                closeShareMenu();
                alert("Could not open the share menu or read the PGN.");
                return null;
            });
    }

    function sendToLichess() {
        var result = getCurrentPgnViaShareMenu();
        if (!result) return;

        Promise.resolve(result).then(function (pgn) {
            if (!pgn) return;
            window.open("https://lichess.org/paste#pgn=" + encodeURIComponent(pgn));
        });
    }

    function closeShareMenu() {
        var close = document.querySelector('[data-cy="modal-close"]') ||
            document.querySelector('[aria-label="Close"]') ||
            document.querySelector('[aria-label="Cerrar"]') ||
            document.querySelector("div.icon-font-chess.x.ui_outside-close-icon");
        if (close) close.click();
    }

    function waitForEl(selector, timeout) {
        return new Promise(function (resolve, reject) {
            var el = document.querySelector(selector);
            if (el) return resolve(el);

            var timer;
            var observer = new MutationObserver(function () {
                el = document.querySelector(selector);
                if (el) {
                    observer.disconnect();
                    clearTimeout(timer);
                    resolve(el);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });

            timer = setTimeout(function () {
                observer.disconnect();
                reject(new Error("Timeout: " + selector));
            }, timeout || 10000);
        });
    }
})();
