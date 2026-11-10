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
      svg: '<path d="M4 4l7.6 9.7L4.4 20h2.3l5.9-6.9L17.8 20H20l-7.9-10L19.4 4h-2.3l-5.4 6.3L7.2 4z" fill="currentColor" stroke="none"></path>'
    },
    {
      label: "LinkedIn",
      href: "#",
      svg: '<rect x="3" y="3" width="18" height="18" rx="3.5"></rect><path d="M7.6 10.6V17"></path><circle cx="7.6" cy="7.6" r="1.1" fill="currentColor" stroke="none"></circle><path d="M11.6 17v-3.6a2.4 2.4 0 0 1 4.8 0V17"></path>'
    },
    {
      label: "Instagram",
      href: "#",
      svg: '<rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"></circle>'
    },
    {
      label: "YouTube",
      href: "#",
      svg: '<rect x="2.5" y="6" width="19" height="12" rx="4"></rect><path d="M10.2 9.4l5 2.6-5 2.6z" fill="currentColor" stroke="none"></path>'
    }
  ]
    .map(
      (s) =>
        `<li><a class="footer__social" href="${esc(s.href)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(
          s.label
        )}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${s.svg}</svg></a></li>`
    )
    .join("");

  return `
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
          <button class="footer__top-btn" type="button" data-back-to-top>
            Back to top
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"></path><path d="M6 11l6-6 6 6"></path></svg>
          </button>
        </div>
      </div>
    </div>`;
};

class SiteFooter extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered) return;
    this.dataset.rendered = "true";

    Data.get("site")
      .then((site) => {
        this.innerHTML = `<footer class="footer">${Footer(site)}</footer>`;
        this.wire();
      })
      .catch(() => {
        this.innerHTML = `<footer class="footer"><div class="container">
          <div class="footer__bottom"><span>SkillMarket</span></div>
        </div></footer>`;
      });
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

    const backToTop = this.querySelector("[data-back-to-top]");
    if (backToTop) {
      backToTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }
}

customElements.define("site-footer", SiteFooter);
