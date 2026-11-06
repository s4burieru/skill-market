const Navbar = (site) => {
  const { brand, navbar } = site;
  const esc = Components.esc;
  const user = Session.get();

  const initials = (name) =>
    String(name || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");

  const actions = user
    ? `
      <span class="navbar__user">
        <span class="navbar__avatar" aria-hidden="true">${esc(initials(user.name))}</span>
        <span class="navbar__who">
          <span class="navbar__name">${esc(user.name)}</span>
          <span class="navbar__role">${esc(Session.roleLabel(user.role))}</span>
        </span>
      </span>
      <button class="navbar__logout" type="button" data-logout>
        ${Icons.svg("log-out")}<span>Log out</span>
      </button>`
    : `
      <a class="navbar__login" href="${esc(navbar.login.href)}">${esc(navbar.login.label)}</a>
      <a class="btn btn--primary btn--sm" href="${esc(navbar.join.href)}">${esc(navbar.join.label)}</a>`;

  return `
    <div class="navbar__inner container">
      <a class="brand" href="index.html">
        <img class="brand__logo" src="img/logo-1.png" alt="${esc(brand.name)}">
      </a>

      <nav class="nav" id="site-nav" aria-label="Primary navigation">
        <ul class="nav__list">${Components.linkList(navbar.links, "nav__link")}</ul>
      </nav>

      <div class="navbar__actions">
        ${actions}
        <button class="nav-toggle" type="button" aria-label="Toggle navigation"
                aria-expanded="false" aria-controls="site-nav">${Icons.svg("menu")}</button>
      </div>
    </div>`;
};

class SiteNavbar extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered) return;
    this.dataset.rendered = "true";

    this.#render();
    Session.onChange(() => this.#render());
  }

  #render() {
    Data.get("site")
      .then((site) => {
        this.innerHTML = `<header class="navbar">${Navbar(site)}</header>`;
        this.#wireToggle();
        this.#wireLogout();
      })
      .catch(() => {
        this.innerHTML = `<header class="navbar"><div class="navbar__inner container">
          <a class="brand" href="index.html"><img class="brand__logo" src="img/logo-1.png" alt="SkillMarket"></a>
        </div></header>`;
      });
  }

  #wireToggle() {
    const navbar = this.querySelector(".navbar");
    const toggle = this.querySelector(".nav-toggle");
    if (!navbar || !toggle) return;

    const setOpen = (open) => {
      navbar.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.innerHTML = Icons.svg(open ? "close" : "menu");
    };

    toggle.addEventListener("click", () => {
      setOpen(!navbar.classList.contains("is-open"));
    });

    this.querySelectorAll(".nav__link").forEach((a) =>
      a.addEventListener("click", () => setOpen(false))
    );
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  #wireLogout() {
    const button = this.querySelector("[data-logout]");
    if (!button) return;

    button.addEventListener("click", () => {
      Session.clear();

      const page = window.location.pathname.split("/").pop() || "index.html";
      if (page === "login.html" || page === "join.html") return;
      window.location.href = "index.html";
    });
  }
}

customElements.define("site-navbar", SiteNavbar);
