/* ============================================================
   SkillMarket: Scroll Reveal
   Vanilla JS, no dependencies.

   Elements matching the selector list below get a gentle
   fade-and-rise animation the first time they scroll into view.
   Because page data (cards, grids) is injected asynchronously by
   js/data.js and friends, a MutationObserver picks up nodes that
   appear after the initial scan.

   Notes:
   - The `.reveal` hidden state is only ever applied via JS, so
     content stays fully visible when JS (or this file) is missing.
   - Respects `prefers-reduced-motion`: no classes are added at all.
   - Any element can opt in manually with the `data-reveal` attribute.
   ============================================================ */
(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (prefersReduced.matches || !("IntersectionObserver" in window)) return;

  const SELECTOR = [
    ".hero__inner > *",
    ".section__head",
    "[data-grid] > *",
    ".step-card",
    ".pills > *",
    ".stat",
    ".panel",
    "[data-reveal]",
  ].join(",");

  const MAX_DELAY_MS = 420;
  const STEP_MS = 70;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  function collect(root, found) {
    if (root instanceof Element && root.matches(SELECTOR)) found.push(root);
    root.querySelectorAll(SELECTOR).forEach((el) => found.push(el));
  }

  function register(root) {
    const found = [];
    collect(root, found);
    if (!found.length) return;

    // Stagger siblings within the same parent so grids cascade in.
    const byParent = new Map();
    for (const el of found) {
      const parent = el.parentElement;
      if (!byParent.has(parent)) byParent.set(parent, []);
      byParent.get(parent).push(el);
    }

    for (const group of byParent.values()) {
      group.forEach((el, index) => {
        if (el.classList.contains("reveal")) return;
        el.style.setProperty(
          "--reveal-delay",
          `${Math.min(index * STEP_MS, MAX_DELAY_MS)}ms`
        );
        el.classList.add("reveal");
        io.observe(el);
      });
    }
  }

  const MO = window.MutationObserver;
  if (MO) {
    const mo = new MO((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) register(node);
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  register(document.body);
})();
