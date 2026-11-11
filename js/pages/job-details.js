/* Job detail page: full brief, apply panel and similar roles. */
(() => {
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => Components.esc(value);
  const icon = (name) => Icons.svg(name);

  const id = new URLSearchParams(location.search).get("id");

  function notFound(message) {
    const root = $("[data-detail-root]");
    if (!root) return;
    root.innerHTML = `
      <div class="detail-notfound">
        <h1>Job not found</h1>
        <p>${esc(message)}</p>
        <a class="btn btn--primary" href="jobs.html">Back to all jobs</a>
      </div>`;
  }

  function list(items, className) {
    return `<ul class="${className}">${(items || [])
      .map((item) => `<li>${esc(item)}</li>`)
      .join("")}</ul>`;
  }

  function render(job) {
    const root = $("[data-detail-root]");

    const meta = [
      { icon: "wallet", text: job.salary },
      { icon: "map-pin", text: job.location },
      { icon: "clock", text: job.schedule },
      { icon: "trending-up", text: job.level },
      { icon: "calendar", text: `Posted ${job.posted}` }
    ]
      .map(
        (item) =>
          `<span class="tag">${icon(item.icon)}<span>${esc(item.text)}</span></span>`
      )
      .join("");

    root.innerHTML = `
      <div class="detail__main">
        <article class="panel">
          <header class="job-head">
            <div class="job-head__top">
              <span class="job-head__logo" style="background:${esc(
                job.logo.color
              )}">${esc(job.logo.initials)}</span>
              <div class="job-head__id">
                <h1 class="detail__title">${esc(job.title)}</h1>
                <p class="job-head__company">${esc(job.company)} · ${esc(job.location)}</p>
              </div>
              <span class="badge badge--tag">${esc(job.badge)}</span>
            </div>

            <div class="job-head__meta">${meta}</div>

            <div class="job-head__actions">
              <a class="btn btn--primary" href="join.html">Apply now</a>
              <a class="btn btn--secondary" href="login.html">Save job</a>
            </div>
          </header>

          <section class="detail__block">
            <h2>About the role</h2>
            <p>${esc(job.description)}</p>
          </section>

          <section class="detail__block">
            <h2>Responsibilities</h2>
            ${list(job.responsibilities, "checklist")}
          </section>

          <section class="detail__block">
            <h2>Requirements</h2>
            ${list(job.requirements, "spec-list")}
          </section>

          <section class="detail__block">
            <h2>Benefits</h2>
            ${list(job.benefits, "checklist")}
          </section>
        </article>
      </div>

      <aside class="detail__side" aria-label="Apply for this job">
        <div class="price-card">
          <p class="price-card__label">Compensation</p>
          <p class="price-card__price">${esc(job.salary)}</p>

          <ul class="price-card__meta">
            <li>
              <span class="price-card__row">${icon("map-pin")} Location</span>
              <strong>${esc(job.location)}</strong>
            </li>
            <li>
              <span class="price-card__row">${icon("clock")} Schedule</span>
              <strong>${esc(job.schedule)}</strong>
            </li>
            <li>
              <span class="price-card__row">${icon("trending-up")} Level</span>
              <strong>${esc(job.level)}</strong>
            </li>
            <li>
              <span class="price-card__row">${icon("calendar")} Posted</span>
              <strong>${esc(job.posted)}</strong>
            </li>
          </ul>

          <a class="btn btn--primary" href="join.html">Apply now</a>
          <a class="btn btn--secondary" href="login.html">Save job</a>
          <p class="price-card__note">Applications go straight to the hiring team — expect a reply within a week.</p>
        </div>

        <div class="side-card">
          <h3>About ${esc(job.company)}</h3>
          <p class="side-card__text">${esc(job.companyAbout)}</p>
        </div>
      </aside>`;
  }

  function renderRelated(job, jobs) {
    const section = $("[data-related-section]");
    const grid = $("[data-related]");
    if (!section || !grid) return;

    const related = jobs.items
      .filter((item) => item.id !== job.id)
      .sort(
        (a, b) =>
          (b.schedule === job.schedule) - (a.schedule === job.schedule) ||
          (b.location === job.location) - (a.location === job.location)
      )
      .slice(0, 3);

    if (!related.length) return;

    grid.innerHTML = related.map(Components.JobCard).join("");
    section.removeAttribute("hidden");
  }

  Data.getAll(["jobs", "site"])
    .then(([jobs, site]) => {
      const job = jobs.items.find((item) => item.id === id);

      if (!job) {
        notFound("That job posting does not exist — it may have been filled.");
        return;
      }

      document.title = `${job.title} at ${job.company} · SkillMarket`;

      const parent = $("[data-crumb-parent]");
      const current = $("[data-crumb-current]");
      if (parent) {
        parent.textContent = job.company;
        parent.href = "jobs.html";
      }
      if (current) current.textContent = job.title;

      render(job);
      renderRelated(job, jobs);

      const cta = $("[data-cta]");
      if (cta && site && site.cta) cta.innerHTML = Components.Cta(site.cta);
    })
    .catch((error) => {
      console.error(error);
      notFound("We could not load this job right now.");
    });
})();
