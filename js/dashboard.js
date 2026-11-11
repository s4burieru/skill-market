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

  // Just the clickable row; the caller decides which list element wraps it so
  // that every row lives inside a <ul> (the stylesheet resets list markers
  // there — a bare <li> outside a list keeps its bullet).
  const row = (item, extraClass = "", attrs = "") => `
      <a class="sidebar__link${extraClass ? ` ${extraClass}` : ""}" href="${esc(item.href)}"${attrs}>
        ${Icons.svg(item.icon)}
        <span>${esc(item.label)}</span>
      </a>`;

  const link = (item, extraClass = "", attrs = "") => `<li>${row(item, extraClass, attrs)}</li>`;

  /**
   * Bottom of the sidebar. The log-out is a button, never a link, and it never
   * acts on the first click: it swaps the list for a confirmation panel so a
   * stray click cannot sign the user out.
   */
  function SidebarFoot(config, brand = "SkillMarket") {
    const base = config || {};
    const logout = base.logout || { label: "Log out", icon: "log-out" };
    const confirmId = "sidebar-logout-confirm";

    return `
        <div class="sidebar__foot">
          <ul class="sidebar__foot-list">
            ${base.help ? `<li>${row(base.help)}</li>` : ""}
            <li>
              <button class="sidebar__link sidebar__link--danger" type="button" data-logout
                      aria-expanded="false" aria-controls="${confirmId}">
                ${Icons.svg(logout.icon || "log-out")}
                <span>${esc(logout.label || "Log out")}</span>
              </button>
            </li>
          </ul>

          <div class="sidebar__confirm" id="${confirmId}" role="group"
               aria-label="Confirm log out" hidden>
            <p class="sidebar__confirm-title">Log out of ${esc(brand)}?</p>
            <p class="sidebar__confirm-text">You'll need to sign in again to reach your dashboard.</p>
            <div class="sidebar__confirm-actions">
              <button class="btn btn--secondary btn--sm" type="button" data-logout-cancel>Cancel</button>
              <button class="btn btn--danger btn--sm" type="button" data-logout-yes>Log out</button>
            </div>
          </div>
        </div>`;
  }

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

    return `
      <aside class="sidebar" id="dashboard-nav">
        <a class="sidebar__brand" href="index.html" aria-label="${esc(brand.name)} home">
          <img src="img/logo-1.png" alt="${esc(brand.name)}" />
        </a>
        <nav class="sidebar__nav" aria-label="Dashboard">${groups}</nav>
        ${SidebarFoot(config, brand.name)}
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
        ${SidebarFoot(null, brand)}
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

  const sectionTarget = (href) => (href.length > 1 ? document.getElementById(href.slice(1)) : null);

  function wireNav() {
    $$("a.sidebar__link").forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        const href = anchor.getAttribute("href") || "";
        const section = sectionTarget(href);

        if (href.length > 1 && !section) {
          event.preventDefault();
        } else if (section) {
          setActiveLink(anchor);
        }

        if (sidebarElement().classList.contains("is-open")) setDrawer(false);
      });
    });

    wireFoot();
    wireSpy();
  }

  /**
   * The footer's log-out opens a confirmation panel instead of signing the
   * user out immediately. Escape and Cancel both back out of it.
   */
  function wireFoot() {
    const host = sidebarElement();
    if (!host) return;

    const foot = $(".sidebar__foot", host);
    const trigger = $("[data-logout]", foot || host);
    const panel = $(".sidebar__confirm", foot || host);
    const cancel = panel && $("[data-logout-cancel]", panel);
    const confirm = panel && $("[data-logout-yes]", panel);
    if (!foot || !trigger || !panel || !cancel || !confirm) return;

    const setOpen = (open) => {
      panel.hidden = !open;
      foot.classList.toggle("is-confirming", open);
      trigger.setAttribute("aria-expanded", String(open));
      (open ? cancel : trigger).focus();
    };

    // Bound to every log-out affordance in the sidebar, link or button: the
    // default navigation is always intercepted so one click can never log out.
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      if (panel.hidden) setOpen(true);
    });

    cancel.addEventListener("click", () => setOpen(false));

    confirm.addEventListener("click", () => {
      Session.clear();
      window.location.href = "index.html";
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !panel.hidden) setOpen(false);
    });
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

  /* Stamps the issue date on the overview ticket ("Tue 11 Nov 2026").
     Assembled by hand rather than toLocaleDateString so every browser
     prints the same ticket header. */
  function paintIssueDate() {
    const el = $(".dash__meta-date");
    if (!el) return;

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const now = new Date();
    const day = days[now.getDay()];
    const date = String(now.getDate()).padStart(2, "0");
    const month = months[now.getMonth()];

    el.textContent = `${day} ${date} ${month} ${now.getFullYear()}`;
  }

  function init() {
    paintIssueDate();

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
