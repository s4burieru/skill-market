const Icons = (() => {
  const paths = {
    star: '<path d="M12 3.6l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"></path>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"></path>',
    close: '<path d="M6 6l12 12M18 6L6 18"></path>',
    wallet: '<path d="M20 7H5a2 2 0 0 1 0-4h13v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h15V7H5"></path><path d="M16 13h2"></path>',
    "map-pin": '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"></path><circle cx="12" cy="10" r="3"></circle>',
    clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7.5V12l3 1.8"></path>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M8 3v4M16 3v4M3 10h18"></path>',
    "trending-up": '<path d="M3 17l6-6 4 4 7-7"></path><path d="M14 8h6v6"></path>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect>',
    "chevron-down": '<path d="M6 9l6 6 6-6"></path>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.7 21a2 2 0 0 1-3.4 0"></path>',
    inbox:
      '<path d="M22 12h-6l-2 3h-4l-2-3H2"></path><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>',
    folder:
      '<path d="M3 8a2 2 0 0 1 2-2h3.6l2 2.5H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>',
    "file-text":
      '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"></path><path d="M14 3v5h5"></path><path d="M9 13h6"></path><path d="M9 17h4"></path>',
    message:
      '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.7 8.7 0 0 1-3.8-.9L3 21l1.9-5.6A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"></path>',
    "bar-chart": '<path d="M18 20V10"></path><path d="M12 20V4"></path><path d="M6 20v-6"></path>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
    users:
      '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.9"></path><path d="M16 3.1a4 4 0 0 1 0 7.8"></path>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>',
    flag:
      '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><path d="M4 22v-7"></path>',
    settings:
      '<circle cx="12" cy="12" r="3"></circle><path d="M19.1 14.4a1.5 1.5 0 0 0 .3 1.7l.1.1a1.9 1.9 0 1 1-2.7 2.7l-.1-.1a1.5 1.5 0 0 0-1.7-.3 1.5 1.5 0 0 0-.9 1.4v.2a1.9 1.9 0 1 1-3.8 0v-.1a1.5 1.5 0 0 0-1-1.4 1.5 1.5 0 0 0-1.7.3l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1.5 1.5 0 0 0 .3-1.7 1.5 1.5 0 0 0-1.4-.9h-.2a1.9 1.9 0 1 1 0-3.8h.1a1.5 1.5 0 0 0 1.4-1 1.5 1.5 0 0 0-.3-1.7l-.1-.1a1.9 1.9 0 1 1 2.7-2.7l.1.1a1.5 1.5 0 0 0 1.7.3h.1a1.5 1.5 0 0 0 .9-1.4v-.2a1.9 1.9 0 1 1 3.8 0v.1a1.5 1.5 0 0 0 .9 1.4 1.5 1.5 0 0 0 1.7-.3l.1-.1a1.9 1.9 0 1 1 2.7 2.7l-.1.1a1.5 1.5 0 0 0-.3 1.7v.1a1.5 1.5 0 0 0 1.4.9h.2a1.9 1.9 0 1 1 0 3.8h-.1a1.5 1.5 0 0 0-1.4.9z"></path>',
    help: '<circle cx="12" cy="12" r="9"></circle><path d="M9.1 9.3a3 3 0 0 1 5.8 1c0 2-2.9 2.7-2.9 4"></path><path d="M12 17.3h.01"></path>',
    "log-out":
      '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><path d="M16 17l5-5-5-5"></path><path d="M21 12H9"></path>'
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

  return { svg, path: (name) => paths[name] || "" };
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
            <a class="btn btn--primary btn--sm" href="service-details.html?id=${esc(
              service.id
            )}">View</a>
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
            <a class="btn btn--primary btn--sm" href="freelancer-details.html?id=${esc(
              person.id
            )}">View</a>
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
          <a class="btn btn--primary btn--sm" href="job-details.html?id=${esc(job.id)}">Apply Now</a>
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

  /* Reviews & ratings (service / freelancer detail pages) -------------------- */

  function StarRow(rating) {
    const value = Number(rating) || 0;
    const stars = [1, 2, 3, 4, 5]
      .map((i) => {
        const on = value >= i - 0.25;
        return `<svg class="star${on ? " star--on" : ""}" viewBox="0 0 24 24"
          fill="${on ? "currentColor" : "none"}" stroke="${on ? "none" : "currentColor"}"
          stroke-width="2" stroke-linejoin="round" aria-hidden="true">${Icons.path("star")}</svg>`;
      })
      .join("");

    return `<span class="stars" role="img" aria-label="${esc(value)} out of 5 stars">${stars}</span>`;
  }

  function initials(name) {
    return String(name || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }

  function ReviewItem(review) {
    const meta = [review.role, review.date].filter(Boolean).map(esc).join(" · ");

    return `
      <article class="review">
        <div class="review__head">
          <span class="review__avatar" aria-hidden="true">${esc(initials(review.name))}</span>
          <div class="review__id">
            <p class="review__name">${esc(review.name)}</p>
            <p class="review__meta">${meta}</p>
          </div>
          <div class="review__rating">
            ${StarRow(review.rating)}
            <span class="review__score">${esc(review.rating)}</span>
          </div>
        </div>
        <p class="review__text">${esc(review.text)}</p>
      </article>`;
  }

  function ReviewList(reviews) {
    if (!reviews || !reviews.length) {
      return `<p class="empty-state">No reviews yet — be the first to leave one.</p>`;
    }
    return `<div class="review-list">${reviews.map(ReviewItem).join("")}</div>`;
  }

  function RatingSummary(rating, count, note) {
    return `
      <div class="rating-summary">
        <div class="rating-summary__score">
          <span class="rating-summary__value">${esc(rating)}</span>
          <span class="rating-summary__stars">${StarRow(rating)}</span>
          <span class="rating-summary__count">${esc(count)} review${
      Number(count) === 1 ? "" : "s"
    }</span>
        </div>
        <p class="rating-summary__note">${esc(
          note || "Reviews come from clients who completed an order on SkillMarket."
        )}</p>
      </div>`;
  }

  return {
    ServiceCard,
    FreelancerCard,
    JobCard,
    Pill,
    Cta,
    linkList,
    esc,
    StarRow,
    ReviewItem,
    ReviewList,
    RatingSummary
  };
})();
