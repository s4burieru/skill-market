/* Home page interactions: marquee, testimonials carousel, FAQ accordion. */
(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Trusted-by logo rows */
  if (!prefersReduced.matches) {
    document.querySelectorAll("[data-marquee-track]").forEach((track) => {
      const group = track.querySelector(".marquee__group");
      if (!group) return;

      const viewport = track.closest(".marquee__viewport");
      const viewportWidth = viewport ? viewport.offsetWidth : window.innerWidth;
      const groupWidth = group.offsetWidth;
      if (!groupWidth) return;

      let count = Math.max(2, Math.ceil((viewportWidth * 2) / groupWidth) + 1);
      if (count % 2) count += 1; // -50% must land on a whole group boundary

      for (let i = 1; i < count; i++) {
        const clone = group.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
      }
      track.classList.add("has-loop");
    });
  }

  /* Testimonials carousel */
  const viewport = document.querySelector("[data-quotes]");
  if (viewport) {
    const slides = Array.from(viewport.querySelectorAll(".quote"));
    const trackEl = viewport.querySelector(".quotes__track");
    const dotsHost = viewport.querySelector("[data-quotes-dots]");
    const countEl = viewport.querySelector("[data-quotes-count]");
    const prevBtn = viewport.querySelector("[data-quotes-prev]");
    const nextBtn = viewport.querySelector("[data-quotes-next]");

    let index = 0;
    let autoplayId = null;
    const AUTOPLAY_MS = 6000;

    const render = () => {
      trackEl.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
      });
      if (dotsHost) {
        dotsHost.querySelectorAll(".quotes__dot").forEach((dot, i) => {
          dot.setAttribute("aria-current", String(i === index));
        });
      }
      if (countEl) {
        countEl.textContent = `${String(index + 1).padStart(2, "0")} / ${String(
          slides.length
        ).padStart(2, "0")}`;
      }
    };

    const goTo = (i) => {
      index = (i + slides.length) % slides.length;
      render();
    };

    const stopAutoplay = () => {
      if (autoplayId !== null) {
        window.clearInterval(autoplayId);
        autoplayId = null;
      }
    };

    const startAutoplay = () => {
      stopAutoplay();
      if (prefersReduced.matches || slides.length < 2) return;
      autoplayId = window.setInterval(() => goTo(index + 1), AUTOPLAY_MS);
    };

    if (dotsHost) {
      dotsHost.innerHTML = slides
        .map(
          (_, i) =>
            `<button type="button" class="quotes__dot" data-quote-dot="${i}" aria-label="Show testimonial ${
              i + 1
            } of ${slides.length}" aria-current="${i === 0}"></button>`
        )
        .join("");
    }

    prevBtn?.addEventListener("click", () => {
      goTo(index - 1);
      startAutoplay();
    });
    nextBtn?.addEventListener("click", () => {
      goTo(index + 1);
      startAutoplay();
    });
    dotsHost?.addEventListener("click", (event) => {
      const dot = event.target.closest("[data-quote-dot]");
      if (!dot) return;
      goTo(Number(dot.dataset.quoteDot));
      startAutoplay();
    });

    viewport.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(index - 1);
        startAutoplay();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(index + 1);
        startAutoplay();
      }
    });

    viewport.addEventListener("pointerenter", stopAutoplay);
    viewport.addEventListener("pointerleave", startAutoplay);
    viewport.addEventListener("focusin", stopAutoplay);
    viewport.addEventListener("focusout", startAutoplay);

    let touchStartX = null;
    viewport.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.touches[0].clientX;
      },
      { passive: true }
    );
    viewport.addEventListener(
      "touchend",
      (event) => {
        if (touchStartX === null) return;
        const delta = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(delta) > 40) {
          goTo(index + (delta < 0 ? 1 : -1));
          startAutoplay();
        }
        touchStartX = null;
      },
      { passive: true }
    );

    render();
    startAutoplay();
  }

  /* FAQ accordion */
  const faqList = document.querySelector("[data-faq]");
  if (faqList) {
    const items = Array.from(faqList.querySelectorAll(".faq__item"));

    const setOpen = (item, open) => {
      item.dataset.open = String(open);
      const button = item.querySelector(".faq__q");
      if (button) button.setAttribute("aria-expanded", String(open));
    };

    faqList.addEventListener("click", (event) => {
      const button = event.target.closest(".faq__q");
      if (!button) return;
      const item = button.closest(".faq__item");
      const willOpen = item.dataset.open !== "true";
      for (const other of items) setOpen(other, false);
      if (willOpen) setOpen(item, true);
    });
  }
})();
