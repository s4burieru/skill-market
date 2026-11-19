const Footer = (site) => {
  const { brand, footer } = site;
  const esc = Components.esc;

  const columns = footer.columns
    .map(
      (col) => `
      <div class="footer__col">
        <h3 class="footer__title">${esc(col.title)}</h3>
        <ul class="footer__links">${Components.linkList(col.links)}</ul>
      </div>`
    )
    .join("");

  const legal = footer.legal.links
    .map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`)
    .join("");

  const socials = [
    {
      label: "X",
      href: "#",
      svg: '<path d="M4.2 4h3.15l5.1 6.5L18 4h2.4l-6.35 8.15L19.2 20h-3.15l-5.35-6.8L5.6 20H3.2l6.15-8.15L4.2 4Z" fill-rule="evenodd"></path>'
    },
    {
      label: "LinkedIn",
      href: "#",
      svg: '<path fill-rule="evenodd" d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Zm3.7 4.9a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM6.7 11h2v7h-2v-7Zm3.3 0h1.9v1h.15c.3-.55 1.05-1.3 2.15-1.3 2.3 0 2.75 1.5 2.75 3.5V18h-2v-3.2c0-.8-.05-1.8-1.2-1.8-1.25 0-1.75 1-1.75 1.8V18h-2v-7Z"></path>'
    },
    {
      label: "Instagram",
      href: "#",
      svg: '<path fill-rule="evenodd" d="M9 3.5h6A5.5 5.5 0 0 1 20.5 9v6a5.5 5.5 0 0 1-5.5 5.5H9A5.5 5.5 0 0 1 3.5 15V9A5.5 5.5 0 0 1 9 3.5Zm3 4.75a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Zm6.4-.95a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z"></path>'
    },
    {
      label: "YouTube",
      href: "#",
      svg: '<path fill-rule="evenodd" d="M9.3 4.5h5.4a5 5 0 0 1 5 5v5a5 5 0 0 1-5 5H9.3a5 5 0 0 1-5-5v-5a5 5 0 0 1 5-5Zm.9 4.9v5.2l4.4-2.6-4.4-2.6Z"></path>'
    }
  ]
    .map(
      (s) =>
        `<li><a class="footer__social" href="${esc(s.href)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(
          s.label
        )}"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${s.svg}</svg></a></li>`
    )
    .join("");

  return `
    <img class="footer__watermark" src="img/logo-1.png" alt="" aria-hidden="true" loading="lazy">
    <div class="container">
      <div class="footer__top">
        <div class="footer__intro">
          <h2 class="footer__heading">Never miss a new opportunity</h2>
          <p class="footer__sub">Fresh jobs, standout talent and marketplace tips, in one short digest every week.</p>
        </div>
        <form class="footer__subscribe" novalidate>
          <label class="sr-only" for="footer-email">Email address</label>
          <input class="footer__input" id="footer-email" name="email" type="email" placeholder="you@example.com" autocomplete="email" required>
          <button class="btn btn--primary" type="submit">Subscribe</button>
          <p class="footer__status" role="status" aria-live="polite"></p>
        </form>
      </div>

      <div class="footer__grid">
        <div class="footer__brand">
          <a href="index.html" aria-label="${esc(brand.name)} home">
            <img class="footer__brand-logo" src="img/logo-2.png" alt="${esc(brand.name)}">
          </a>
          <p class="footer__tagline">${esc(brand.tagline)}</p>
          <ul class="footer__socials">${socials}</ul>
        </div>
        ${columns}
      </div>

      <div class="footer__bottom">
        <span class="footer__copy">${esc(footer.legal.copyright)}</span>
        <div class="footer__right">
          <div class="footer__legal">${legal}</div>

        </div>
      </div>
    </div>`;
};

class SiteFooter extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered) return;
    this.dataset.rendered = "true";

    this.renderBackToTop();

    Data.get("site")
      .then((site) => {
        this.innerHTML = `<footer class="footer">${Footer(site)}</footer>`;
        this.wire();
        this.driftWatermark();
      })
      .catch(() => {
        this.innerHTML = `<footer class="footer"><div class="container">
          <div class="footer__bottom"><span>SkillMarket</span></div>
        </div></footer>`;
      });
  }

  // Watermark slides diagonally on scroll; skipped under reduced motion.
  driftWatermark() {
    const watermark = this.querySelector(".footer__watermark");
    const footer = this.querySelector(".footer");
    if (!watermark || !footer) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = footer.getBoundingClientRect();
      const span = window.innerHeight + rect.height;
      const progress = Math.min(Math.max((window.innerHeight - rect.top) / span, 0), 1);
      const shift = (progress - 0.5) * 80;
      watermark.style.transform = `translate3d(${(shift * 0.55).toFixed(1)}px, ${shift.toFixed(1)}px, 0)`;
    };
    const requestUpdate = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    update();
  }

  wire() {
    const form = this.querySelector(".footer__subscribe");
    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = form.querySelector(".footer__input");
        const status = form.querySelector(".footer__status");
        const value = input.value.trim();
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

        if (!valid) {
          status.textContent = "Please enter a valid email address.";
          status.classList.add("is-error");
          input.focus();
          return;
        }

        status.classList.remove("is-error");
        status.textContent = `Thanks, the next digest will go to ${value}.`;
        form.reset();
      });
    }
  }

  // Floating back-to-top button, appended to the body.
  renderBackToTop() {
    if (document.querySelector(".back-to-top")) return;

    const button = document.createElement("button");
    button.className = "back-to-top";
    button.type = "button";
    button.setAttribute("aria-label", "Back to top");
    button.innerHTML =
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3.2 20.4 12.2h-4.2V20a1.6 1.6 0 0 1-1.6 1.6H9.4A1.6 1.6 0 0 1 7.8 20v-7.8H3.6L12 3.2Z"/></svg>';

    const toggle = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      // Hide near the bottom so it doesn't cover the footer's legal links.
      const show = window.scrollY > 320 && window.scrollY < max - 60;
      button.classList.toggle("is-visible", show);
      button.tabIndex = show ? 0 : -1;
      button.setAttribute("aria-hidden", String(!show));
    };

    button.addEventListener("click", () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });

    window.addEventListener("scroll", toggle, { passive: true });
    window.addEventListener("resize", toggle);
    document.body.appendChild(button);
    toggle();
  }
}

customElements.define("site-footer", SiteFooter);
