const Icons = (() => {
  const paths = {
    star: '<path d="M12 3.6l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"></path>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"></path>',
    close: '<path d="M6 6l12 12M18 6L6 18"></path>',
    wallet: '<path d="M20 7H5a2 2 0 0 1 0-4h13v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h15V7H5"></path><path d="M16 13h2"></path>',
    "map-pin": '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"></path><circle cx="12" cy="10" r="3"></circle>',
    clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7.5V12l3 1.8"></path>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M8 3v4M16 3v4M3 10h18"></path>',
    "trending-up": '<path d="M3 17l6-6 4 4 7-7"></path><path d="M14 8h6v6"></path>'
  };

  const filled = new Set(["star"]);

  function svg(name, className = "") {
    const d = paths[name];
    if (!d) return "";
    const fill = filled.has(name) ? "currentColor" : "none";
    const stroke = filled.has(name) ? "none" : "currentColor";
    return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  }

  return { svg };
})();

const Components = (() => {
  const esc = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const linkList = (links, className = "") =>
    links
      .map(
        (l) =>
          `<li><a${className ? ` class="${className}"` : ""} href="${esc(l.href)}">${esc(
            l.label
          )}</a></li>`
      )
      .join("");

  function ServiceCard(service) {
    return `
      <article class="card">
        <div class="card__media">
          <img src="${esc(service.image)}" alt="${esc(service.title)}" loading="lazy" width="800" height="500" />
        </div>
        <div class="card__body">
          <div class="card__top">
            <span class="card__category">${esc(service.category)}</span>
            <span class="rating">${Icons.svg("star")}${esc(service.rating)}</span>
          </div>
          <h3 class="card__title">${esc(service.title)}</h3>
          <p class="card__desc">${esc(service.description)}</p>
          <div class="card__footer">
            <span>
              <span class="price__value">${esc(service.price.min)} - ${esc(service.price.max)}</span>
              <span class="price__label">Starting at</span>
            </span>
            <a class="btn btn--primary btn--sm" href="#">View</a>
          </div>
        </div>
      </article>`;
  }

  function FreelancerCard(person) {
    return `
      <article class="card">
        <div class="card__media">
          <img src="${esc(person.image)}" alt="${esc(person.name)}" loading="lazy" width="600" height="600" />
        </div>
        <div class="card__body">
          <span class="card__category">${esc(person.category)}</span>
          <div class="freelancer__name-row">
            <h3 class="freelancer__name">${esc(person.name)}</h3>
            <span class="rating">${Icons.svg("star")}${esc(person.rating)}</span>
          </div>
          <p class="freelancer__role">${esc(person.role)}</p>
          <div class="card__footer">
            <span class="rate">${esc(person.rate)} <span>/hr</span></span>
            <a class="btn btn--primary btn--sm" href="#">View</a>
          </div>
        </div>
      </article>`;
  }

  function JobCard(job) {
    const meta = [
      { icon: "wallet", text: job.salary, cls: "job-card__salary" },
      { icon: "map-pin", text: job.location },
      { icon: "clock", text: job.schedule },
      { icon: "trending-up", text: job.level },
      { icon: "calendar", text: job.posted }
    ]
      .map(
        (m) =>
          `<li class="${m.cls || ""}">${Icons.svg(m.icon)}<span>${esc(m.text)}</span></li>`
      )
      .join("");

    const tags = job.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("");

    return `
      <article class="job-card">
        <div class="job-card__head">
          <span class="job-card__logo" style="background:${esc(job.logo.color)}">${esc(
            job.logo.initials
          )}</span>
          <div class="job-card__id">
            <h3 class="job-card__title">${esc(job.title)}</h3>
            <p class="job-card__company">${esc(job.company)}</p>
          </div>
          <span class="badge badge--tag">${esc(job.badge)}</span>
        </div>

        <ul class="job-card__meta">${meta}</ul>

        <div class="job-card__foot">
          <div class="job-card__tags">${tags}</div>
          <a class="btn btn--primary btn--sm" href="#">Apply Now</a>
        </div>
      </article>`;
  }

  function Pill(item, active) {
    return `<button class="chip${active ? " is-active" : ""}" type="button"
      data-category="${esc(item.id)}" aria-pressed="${active ? "true" : "false"}">${esc(
      item.label
    )}</button>`;
  }

  function Cta(cta) {
    return `
      <div>
        <h2 class="cta__title">${esc(cta.title)}</h2>
        <p class="cta__text">${esc(cta.text)}</p>
      </div>
      <a class="btn btn--white" href="${esc(cta.button.href)}">${esc(cta.button.label)}</a>`;
  }

  return {
    ServiceCard,
    FreelancerCard,
    JobCard,
    Pill,
    Cta,
    linkList,
    esc
  };
})();
