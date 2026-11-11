/**
 * Shared script for the browse/listing pages: explore.html, freelancers.html
 * and jobs.html. The page picks its data source with <body data-browse="…">.
 *
 * Markup contract (all optional except the grid):
 *   [data-browse-form]    search form (submit scrolls to the results)
 *   [data-browse-input]   search input (live filtering)
 *   [data-browse-pills]   category chips
 *   [data-browse-grid]    results grid
 *   [data-browse-empty]   empty state, toggled by the script
 *   [data-browse-count]   "12 of 24 services" counter
 *   [data-cta]            green CTA band
 */
(() => {
  const esc = (value) => Components.esc(value);

  const slug = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const unique = (values) => [...new Set(values.filter(Boolean))];

  const CONFIG = {
    services: {
      key: "services",
      noun: "service",
      card: (item) => Components.ServiceCard(item),
      chips: (data) => data.categories.map((c) => ({ id: c.id, label: c.label })),
      matchesChip: (item, chip) => slug(item.category) === chip,
      haystack: (item) => `${item.title} ${item.category} ${item.description}`
    },
    freelancers: {
      key: "freelancers",
      noun: "freelancer",
      card: (item) => Components.FreelancerCard(item),
      chips: (data) => [
        { id: "all", label: "All Freelancers" },
        ...unique(data.items.map((p) => p.category)).map((category) => ({
          id: slug(category),
          label: category
        }))
      ],
      matchesChip: (item, chip) => slug(item.category) === chip,
      haystack: (item) =>
        `${item.name} ${item.role} ${item.category} ${(item.skills || []).join(" ")}`
    },
    jobs: {
      key: "jobs",
      noun: "job",
      card: (item) => Components.JobCard(item),
      chips: (data) => [
        { id: "all", label: "All Jobs" },
        ...unique(data.items.map((job) => job.badge)).map((badge) => ({
          id: slug(badge),
          label: badge
        }))
      ],
      matchesChip: (item, chip) => slug(item.badge) === chip,
      haystack: (item) =>
        `${item.title} ${item.company} ${item.location} ${item.schedule} ${item.level} ${(
          item.tags || []
        ).join(" ")}`
    }
  };

  const type = document.body.dataset.browse;
  const config = CONFIG[type];

  if (!config) return;

  const $ = (selector) => document.querySelector(selector);
  const grid = $("[data-browse-grid]");
  const empty = $("[data-browse-empty]");
  const pillsHost = $("[data-browse-pills]");
  const count = $("[data-browse-count]");
  const input = $("[data-browse-input]");

  const state = { category: "all", query: "" };

  let items = [];
  let chips = [];

  const show = (el) => el && el.removeAttribute("hidden");
  const hide = (el) => el && el.setAttribute("hidden", "");

  function filtered() {
    const query = state.query.trim().toLowerCase();

    if (query) {
      return items.filter((item) => config.haystack(item).toLowerCase().includes(query));
    }
    if (state.category !== "all") {
      return items.filter((item) => config.matchesChip(item, state.category));
    }
    return items;
  }

  function renderPills() {
    if (!pillsHost) return;
    pillsHost.innerHTML = chips
      .map((chip) => Components.Pill(chip, chip.id === state.category))
      .join("");
  }

  function renderResults() {
    const list = filtered();

    if (grid) grid.innerHTML = list.map(config.card).join("");

    if (empty) {
      if (list.length) hide(empty);
      else show(empty);
    }

    if (count) {
      const total = items.length;
      count.textContent =
        list.length === total
          ? `${total} ${config.noun}${total === 1 ? "" : "s"}`
          : `${list.length} of ${total} ${config.noun}${total === 1 ? "" : "s"}`;
    }
  }

  function setCategory(id) {
    state.category = id;
    state.query = "";
    if (input) input.value = "";
    renderPills();
    renderResults();
  }

  function wire() {
    const form = $("[data-browse-form]");
    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        state.query = input ? input.value : "";
        if (state.query.trim()) state.category = "all";
        renderPills();
        renderResults();
        if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    if (input) {
      input.addEventListener("input", (event) => {
        state.query = event.target.value;
        if (state.query.trim()) {
          state.category = "all";
          renderPills();
        }
        renderResults();
      });
    }

    if (pillsHost) {
      pillsHost.addEventListener("click", (event) => {
        const pill = event.target.closest("[data-category]");
        if (pill) setCategory(pill.dataset.category);
      });
    }
  }

  Data.getAll([config.key, "site"])
    .then(([data, site]) => {
      items = data.items;
      chips = config.chips(data);

      renderPills();
      renderResults();
      wire();

      const cta = $("[data-cta]");
      if (cta && site && site.cta) cta.innerHTML = Components.Cta(site.cta);
    })
    .catch((error) => {
      console.error(error);
      if (empty) {
        empty.textContent = "We could not load the listings right now. Please reload the page.";
        show(empty);
      }
    });
})();
