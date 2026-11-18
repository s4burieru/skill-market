/* ============================================================
   SkillMarket: Animated stat counters
   Vanilla JS, no dependencies.

   Any element with a `data-count-to` attribute animates from 0
   to that value the first time it scrolls into view.

   Supported modifiers:
     data-count-to="1.03"        target number (required)
     data-count-decimals="2"     fraction digits (default 0)
     data-count-prefix="₱"       text before the number (default "")
     data-count-suffix="k+"      text after the number (default "")

   Notes:
   - The final value stays in the HTML, so the numbers are fully
     readable when JS (or this file) is missing.
   - Respects `prefers-reduced-motion`: nothing is animated.
   ============================================================ */
(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (prefersReduced.matches || !("IntersectionObserver" in window)) return;

  const DURATION_MS = 1500;
  const elements = Array.from(document.querySelectorAll("[data-count-to]"));
  if (!elements.length) return;

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  function format(value, decimals) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  function render(el, value) {
    const decimals = Number(el.dataset.countDecimals || 0);
    const prefix = el.dataset.countPrefix || "";
    const suffix = el.dataset.countSuffix || "";
    el.textContent = prefix + format(value, decimals) + suffix;
  }

  function animate(el) {
    const to = Number(el.dataset.countTo);
    if (!Number.isFinite(to)) return;

    const start = performance.now();

    function frame(now) {
      const t = Math.min((now - start) / DURATION_MS, 1);
      render(el, to * easeOutCubic(t));
      if (t < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        animate(entry.target);
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.4, rootMargin: "0px 0px -40px 0px" }
  );

  for (const el of elements) {
    // Start from zero so the count-up is visible, keep the static
    // final value in the HTML as the no-JS fallback.
    render(el, 0);
    io.observe(el);
  }
})();
