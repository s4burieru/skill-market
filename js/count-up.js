/* Animated stat counters: elements with data-count-to animate 0 → value
   on first scroll into view. Respects prefers-reduced-motion. */
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
    // Final value stays in the HTML as the no-JS fallback.
    render(el, 0);
    io.observe(el);
  }
})();
