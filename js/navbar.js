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

  // The role's dashboard, used by the quick actions and the profile menu.
  const dashboard = user ? Session.dashboardFor(user.role) : null;

  // Quick actions: jump straight to the inbox / activity panel of that dashboard.
  const INBOX_SECTION = {
    freelancer: "messages",
    "hire-talent": "messages",
    "super-admin": "reports"
  };
  const ALERTS_SECTION = {
    freelancer: "activity",
    "hire-talent": "activity",
    "super-admin": "activity"
  };

  const sectionHref = (sections, fallback) => {
    if (!dashboard) return null;
    const id = (user && sections[user.role]) || fallback;
    return `${dashboard}#${id}`;
  };

  const iconBtn = (href, icon, label) => `
    <a class="navbar__icon-btn" href="${esc(href)}" aria-label="${esc(label)}" title="${esc(label)}">
      ${Icons.svg(icon)}<span class="navbar__icon-btn__dot" aria-hidden="true"></span>
    </a>`;

  const inbox = sectionHref(INBOX_SECTION, "messages");
  const alerts = sectionHref(ALERTS_SECTION, "activity");

  const quickActions = [
    inbox ? iconBtn(inbox, "inbox", "Inbox") : "",
    alerts ? iconBtn(alerts, "bell", "Notifications") : ""
  ].join("");

  const menuItems = [
    dashboard
      ? `<a class="navbar__menu-link" role="menuitem" href="${esc(dashboard)}">
           ${Icons.svg("grid")}<span>Dashboard</span>
         </a>`
      : "",
    `<button class="navbar__menu-link navbar__menu-link--danger" role="menuitem" type="button" data-logout>
       ${Icons.svg("log-out")}<span>Log out</span>
     </button>`
  ].join("");

  const actions = user
    ? `
      ${quickActions}
      <div class="navbar__profile" data-profile>
        <button class="navbar__profile-btn" type="button" data-profile-toggle
                aria-haspopup="menu" aria-expanded="false" aria-controls="profile-menu"
                aria-label="${esc(user.name)} — account menu" title="${esc(user.name)}">
          <span class="navbar__avatar" aria-hidden="true">${esc(initials(user.name))}</span>
          ${Icons.svg("chevron-down")}
        </button>

        <div class="navbar__menu" id="profile-menu" role="menu" hidden>
          <div class="navbar__menu-head">
            <span class="navbar__avatar" aria-hidden="true">${esc(initials(user.name))}</span>
            <span class="navbar__menu-id">
              <span class="navbar__menu-name">${esc(user.name)}</span>
              <span class="navbar__menu-role">${esc(Session.roleLabel(user.role))}</span>
              <span class="navbar__menu-mail">${esc(user.email)}</span>
            </span>
          </div>
          ${menuItems}
        </div>
      </div>`
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

    // Close the profile menu on outside clicks / Escape. Registered once, so
    // re-renders never stack duplicate document listeners.
    document.addEventListener("click", (event) => {
      const profile = this.querySelector("[data-profile]");
      if (!profile || !profile.classList.contains("is-open")) return;
      if (profile.contains(event.target)) return;
      this.#setProfile(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const menu = this.querySelector(".navbar__menu:not([hidden])");
      if (!menu) return;

      this.#setProfile(false);
      const toggle = this.querySelector("[data-profile-toggle]");
      if (toggle) toggle.focus();
    });
  }

  #render() {
    Data.get("site")
      .then((site) => {
        this.innerHTML = `<header class="navbar">${Navbar(site)}</header>`;
        this.#wireToggle();
        this.#wireProfile();
        this.#wireLogout();
      })
      .catch(() => {
        this.innerHTML = `<header class="navbar"><div class="navbar__inner container">
          <a class="brand" href="index.html"><img class="brand__logo" src="img/logo-1.png" alt="SkillMarket"></a>
        </div></header>`;
      });
  }

  #setProfile(open) {
    const profile = this.querySelector("[data-profile]");
    const toggle = this.querySelector("[data-profile-toggle]");
    const menu = this.querySelector(".navbar__menu");
    if (!profile || !toggle || !menu) return;

    menu.hidden = !open;
    profile.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }

  #wireProfile() {
    const toggle = this.querySelector("[data-profile-toggle]");
    if (!toggle) return;

    toggle.addEventListener("click", () => {
      const menu = this.querySelector(".navbar__menu");
      this.#setProfile(!menu || menu.hidden);
    });

    // Navigating (or logging out) from the menu closes it right away.
    this.querySelectorAll(".navbar__menu-link").forEach((link) =>
      link.addEventListener("click", () => this.#setProfile(false))
    );
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
