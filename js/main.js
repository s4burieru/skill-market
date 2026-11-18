(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const state = { category: "all", query: "" };

  let services = [];
  let categories = [];

  const show = (el) => el && el.removeAttribute("hidden");
  const hide = (el) => el && el.setAttribute("hidden", "");

  function filteredServices() {
    const query = state.query.trim().toLowerCase();

    if (query) {
      return services.filter((s) =>
        `${s.title} ${s.category} ${s.description}`.toLowerCase().includes(query)
      );
    }
    if (state.category !== "all") {
      return services.filter(
        (s) =>
          s.category
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") === state.category
      );
    }
    return services.filter((s) => s.popular);
  }

  function renderServices() {
    const grid = $('[data-grid="services"]');
    const empty = $('[data-empty="services"]');
    const list = filteredServices();

    grid.innerHTML = list.map(Components.ServiceCard).join("");

    if (list.length) {
      hide(empty);
    } else {
      show(empty);
    }
  }

  function renderPills() {
    const host = $('[data-pills="categories"]');
    host.innerHTML = categories
      .map((c) => Components.Pill(c, c.id === state.category))
      .join("");
  }

  function setCategory(id) {
    state.category = id;
    state.query = "";
    const input = $("#hero-search");
    if (input) input.value = "";
    renderPills();
    renderServices();
  }

  function renderStaticSections(data) {
    const { services: svc, freelancers, jobs } = data;

    services = svc.items;
    categories = svc.categories;

    renderServices();
    renderPills();

    // Two lines of cards only (matches the 10 popular services above);
    // the "View all freelancers" link carries the rest.
    $('[data-grid="freelancers"]').innerHTML = Components.rankedList(freelancers.items)
      .slice(0, 10)
      .map(Components.FreelancerCard)
      .join("");
    $('[data-grid="jobs"]').innerHTML = jobs.items.map(Components.JobCard).join("");
  }

  function wireHowToggle() {
    const tabs = $$("[data-how-tab]");
    if (!tabs.length) return;
    const panels = $$("[data-how-panel]");

    const select = (name, moveFocus) => {
      tabs.forEach((tab) => {
        const active = tab.dataset.howTab === name;
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
        if (active && moveFocus) tab.focus();
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.howPanel !== name;
      });
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => select(tab.dataset.howTab, false));
      tab.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        const dir = event.key === "ArrowRight" ? 1 : -1;
        const next = tabs[(index + dir + tabs.length) % tabs.length];
        select(next.dataset.howTab, true);
      });
    });
  }

  function wireInteractions() {
    wireHowToggle();

    $("[data-search-form]").addEventListener("submit", (event) => {
      event.preventDefault();
      state.query = $("#hero-search").value;
      if (state.query.trim()) state.category = "all";
      renderPills();
      renderServices();
      $("#services").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $("#hero-search").addEventListener("input", (event) => {
      state.query = event.target.value;
      if (state.query.trim()) {
        state.category = "all";
        renderPills();
      }
      renderServices();
    });

    $(".suggestions").addEventListener("click", (event) => {
      const chip = event.target.closest("[data-suggestion]");
      if (!chip) return;
      $("#hero-search").value = chip.dataset.suggestion;
      state.query = chip.dataset.suggestion;
      state.category = "all";
      renderPills();
      renderServices();
      $("#services").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $('[data-pills="categories"]').addEventListener("click", (event) => {
      const pill = event.target.closest("[data-category]");
      if (pill) setCategory(pill.dataset.category);
    });
  }

  Data.getAll(["services", "freelancers", "jobs"])
    .then(([svc, freelancers, jobs]) => {
      renderStaticSections({ services: svc, freelancers, jobs });
      wireInteractions();
    })
    .catch((error) => {
      console.error(error);
    });
})();
