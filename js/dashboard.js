/**
 * Shared dashboard shell for freelancer-dashboard.html,
 * hire-talent-dashboard.html and super-admin-dashboard.html.
 *
 * The <dashboard-sidebar> element renders the navigation from
 * data/site.json → dashboard on every page, so the chrome stays identical
 * and only the page content differs. A page can pass data-variant="…" to
 * pick a different nav for its role (e.g. the super admin's admin menu);
 * the variant falls back to the shared nav for anything it does not override.
 */
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const esc = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  /* --- Sidebar ------------------------------------------------------------ */

  const link = (item, extraClass = "", attrs = "") => `
    <li>
      <a class="sidebar__link${extraClass ? ` ${extraClass}` : ""}" href="${esc(item.href)}"${attrs}>
        ${Icons.svg(item.icon)}
        <span>${esc(item.label)}</span>
      </a>
    </li>`;

  function Sidebar(site, variant) {
    const { brand, dashboard } = site;
    const base = dashboard || {};
    const overrides = (variant && base.variants && base.variants[variant]) || {};
    const config = { ...base, ...overrides };

    const groups = (config.nav || [])
      .map(
        (group) => `
        <div class="sidebar__group">
          <p class="sidebar__label">${esc(group.label)}</p>
          <ul class="sidebar__list">${(group.items || []).map((item) => link(item)).join("")}</ul>
        </div>`
      )
      .join("");

    const foot = [config.help, config.logout]
      .filter(Boolean)
      .map((item, index, list) =>
        link(
          item,
          index === list.length - 1 ? "sidebar__link--danger" : "",
          config.logout && item === config.logout ? " data-logout" : ""
        )
      )
      .join("");

    return `
      <aside class="sidebar" id="dashboard-nav">
        <a class="sidebar__brand" href="index.html" aria-label="${esc(brand.name)} home">
          <img src="img/logo-1.png" alt="${esc(brand.name)}" />
        </a>
        <nav class="sidebar__nav" aria-label="Dashboard">${groups}</nav>
        <div class="sidebar__foot">${foot}</div>
      </aside>`;
  }

  function SidebarFallback(brand = "SkillMarket") {
    return `
      <aside class="sidebar" id="dashboard-nav">
        <a class="sidebar__brand" href="index.html" aria-label="${esc(brand)} home">
          <img src="img/logo-1.png" alt="${esc(brand)}" />
        </a>
        <nav class="sidebar__nav" aria-label="Dashboard">
          <div class="sidebar__group">
            <p class="sidebar__label">Menu</p>
            <ul class="sidebar__list">
              ${link({ label: "Overview", href: "#overview", icon: "grid" })}
              ${link({ label: "Projects", href: "#projects", icon: "folder" })}
              ${link({ label: "Messages", href: "#messages", icon: "message" })}
            </ul>
          </div>
        </nav>
        <div class="sidebar__foot">
          ${link({ label: "Log out", href: "index.html", icon: "log-out" }, "sidebar__link--danger", " data-logout")}
        </div>
      </aside>`;
  }

  /* --- Interactions ------------------------------------------------------- */

  function sidebarElement() {
    return $("dashboard-sidebar");
  }

  function setDrawer(open) {
    const host = sidebarElement();
    const toggle = $("[data-nav-toggle]");
    if (!host || !toggle) return;

    host.classList.toggle("is-open", open);
    document.body.classList.toggle("is-nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    toggle.innerHTML = Icons.svg(open ? "close" : "menu");
  }

  function wireToggle() {
    const toggle = $("[data-nav-toggle]");
    if (!toggle) return;

    toggle.addEventListener("click", () => {
      const open = !sidebarElement().classList.contains("is-open");
      setDrawer(open);
      if (open) {
        const first = $(".sidebar__link");
        if (first) first.focus();
      }
    });

    document.addEventListener("click", (event) => {
      const host = sidebarElement();
      if (!host || !host.classList.contains("is-open")) return;
      if (host.contains(event.target) || toggle.contains(event.target)) return;
      setDrawer(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setDrawer(false);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) setDrawer(false);
    });
  }

  function setActiveLink(active) {
    $$(".sidebar__link").forEach((item) => {
      const on = item === active;
      item.classList.toggle("is-active", on);
      if (on) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
  }

  function wireNav() {
    $$(".sidebar__link").forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        if (anchor.hasAttribute("data-logout")) {
          event.preventDefault();
          Session.clear();
          window.location.href = "index.html";
          return;
        }

        const href = anchor.getAttribute("href") || "";
        const target = href.length > 1 ? document.getElementById(href.slice(1)) : null;

        if (href.length > 1 && !target) {
          event.preventDefault();
        } else if (target) {
          setActiveLink(anchor);
        }

        if (sidebarElement().classList.contains("is-open")) setDrawer(false);
      });
    });

    wireSpy();
  }

  function wireSpy() {
    const targets = $$('.sidebar__link[href^="#"]')
      .map((anchor) => ({ anchor, el: document.getElementById(anchor.getAttribute("href").slice(1)) }))
      .filter((entry) => entry.el);

    if (!targets.length) return;

    let ticking = false;

    const update = () => {
      ticking = false;

      const line = 160;
      let best = null;

      // Whichever section crosses the reading line last wins, so the active
      // item stays correct even though the sidebar order and the panel order
      // are not the same.
      targets.forEach((entry) => {
        const top = entry.el.getBoundingClientRect().top;
        if (top - line <= 0 && (!best || top > best.top)) best = { entry, top };
      });

      setActiveLink(best ? best.entry.anchor : targets[0].anchor);
    };

    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      },
      { passive: true }
    );

    update();
  }

  // Placeholder actions stay inert: block the default jump instead of a popup.
  function wireActions() {
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-notice]");
      if (!trigger) return;
      event.preventDefault();
    });
  }

  /* --- Topbar search: filters the list rows and panels -------------------- */

  function wireSearch() {
    const form = $("[data-dash-search]");
    const empty = $("[data-empty='dash']");
    if (!form) return;

    const input = $(".search__input", form);

    const apply = () => {
      const query = input.value.trim().toLowerCase();
      let matches = 0;

      $$(".list__item, .timeline__item").forEach((row) => {
        const hit = !query || row.textContent.toLowerCase().includes(query);
        row.hidden = !hit;
        if (hit) matches += 1;
      });

      $$(".panel").forEach((panel) => {
        const items = $$(".list__item, .timeline__item", panel);
        if (!query) {
          panel.hidden = false;
        } else if (items.length) {
          panel.hidden = !items.some((item) => !item.hidden);
        } else {
          panel.hidden = !panel.textContent.toLowerCase().includes(query);
        }
      });

      if (empty) empty.hidden = !(query && matches === 0);
    };

    input.addEventListener("input", apply);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      apply();
    });
  }

  /* --- Boot --------------------------------------------------------------- */

  function initials(name) {
    return String(name || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }

  /**
   * The dashboards are only reachable with a session. Returns the signed-in
   * user, or null when we are about to navigate away.
   */
  function guardSession() {
    const user = Session.get();

    if (!user) {
      window.location.replace("login.html");
      return null;
    }

    const page = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    const home = Session.dashboardFor(user.role);

    // Each role gets sent to its own dashboard (see Session.DASHBOARDS).
    if (home && home.toLowerCase() !== page) {
      window.location.replace(home);
      return null;
    }

    return user;
  }

  function personalize(user) {
    const label = Session.roleLabel(user.role);
    const first = Session.firstName(user);
    const full = user.name;

    const title = $(".dash__title");
    if (title) title.textContent = `Welcome back, ${first}`;

    const badge = $(".badge--soft");
    if (badge) badge.textContent = `${label} account`;

    const chipName = $(".user-chip__name");
    if (chipName) chipName.textContent = full;

    const chipRole = $(".user-chip__role");
    if (chipRole) chipRole.textContent = label;

    const avatar = $(".user-chip__avatar");
    if (avatar) {
      avatar.innerHTML = `<span class="user-chip__initials">${esc(initials(full))}</span>`;
      avatar.setAttribute("title", full);
    }
  }

  function init() {
    const user = guardSession();
    if (!user) return;

    personalize(user);
    wireToggle();
    wireActions();
    wireSearch();
  }

  class DashboardSidebar extends HTMLElement {
    connectedCallback() {
      if (this.dataset.rendered) return;
      this.dataset.rendered = "true";

      const variant = this.dataset.variant || "";

      Data.get("site")
        .then((site) => {
          this.innerHTML = Sidebar(site, variant);
          wireNav();
        })
        .catch((error) => {
          console.error(error);
          this.innerHTML = SidebarFallback();
          wireNav();
        });
    }
  }

  customElements.define("dashboard-sidebar", DashboardSidebar);
  init();
})();
