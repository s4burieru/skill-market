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

  return `
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          <img class="footer__brand-logo" src="img/logo-2.png" alt="${esc(brand.name)}">
          <p class="footer__tagline">${esc(brand.tagline)}</p>
        </div>
        ${columns}
      </div>
      <div class="footer__bottom">
        <span>${esc(footer.legal.copyright)}</span>
        <div class="footer__legal">${legal}</div>
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
      })
      .catch(() => {
        this.innerHTML = `<footer class="footer"><div class="container">
          <div class="footer__bottom"><span>SkillMarket</span></div>
        </div></footer>`;
      });
  }
}

customElements.define("site-footer", SiteFooter);
