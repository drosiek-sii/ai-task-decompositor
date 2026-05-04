/**
 * Beads task: bud — Print Friendly Version clientlib JS.
 *
 * Decision #9: Print is the browser's native print dialog, no third-party SDK.
 * Binds delegated click handler so newly authored Social Share components on
 * the page work without re-binding.
 */
(function () {
    "use strict";

    function onClick(event) {
        var target = event.target.closest && event.target.closest(".print-friendly-version");
        if (!target) return;
        event.preventDefault();
        window.print();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            document.addEventListener("click", onClick);
        });
    } else {
        document.addEventListener("click", onClick);
    }
})();
