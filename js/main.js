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
    const { services: svc, freelancers, jobs, site } = data;

    services = svc.items;
    categories = svc.categories;

    renderServices();
    renderPills();

    $('[data-grid="freelancers"]').innerHTML = freelancers.items
      .map(Components.FreelancerCard)
      .join("");
    $('[data-grid="jobs"]').innerHTML = jobs.items.map(Components.JobCard).join("");
    $('[data-cta]').innerHTML = Components.Cta(site.cta);
  }

  function wireInteractions() {
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

  function showNotice(message) {
    const notice = $("#notice");
    notice.innerHTML = message;
    show(notice);
  }

  Data.getAll(["services", "freelancers", "jobs", "site"])
    .then(([svc, freelancers, jobs, site]) => {
      renderStaticSections({ services: svc, freelancers, jobs, site });
      wireInteractions();
    })
    .catch((error) => {
      console.error(error);
      showNotice(
        `<strong>The page could not be rendered.</strong><br>
         ${Components.esc(error.message || String(error))}<br>
         See the browser console for the full error.`
      );
    });
})();
