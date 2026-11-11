/* Freelancer detail page: profile, stats, services and client reviews. */
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
        <h1>Freelancer not found</h1>
        <p>${esc(message)}</p>
        <a class="btn btn--primary" href="freelancers.html">Back to all freelancers</a>
      </div>`;
  }

  function servicesBlock(person, services) {
    const own = (person.services || [])
      .map((serviceId) => services.items.find((item) => item.id === serviceId))
      .filter(Boolean);

    if (!own.length) return "";

    return `
      <section class="detail__block">
        <h2>Services offered</h2>
        <div class="mini-card">
          <img src="${esc(own[0].image)}" alt="" width="46" height="46" />
          <div class="mini-card__id">
            <p class="mini-card__name">${esc(own[0].title)}</p>
            <p class="mini-card__role">${esc(own[0].price.min)} - ${esc(
      own[0].price.max
    )} · ${esc(own[0].delivery)} delivery</p>
          </div>
          <a class="btn btn--secondary btn--sm" href="service-details.html?id=${esc(
            own[0].id
          )}">View service</a>
        </div>
      </section>`;
  }

  function render(person, services) {
    const root = $("[data-detail-root]");

    const meta = [
      `<span class="rating">${icon("star")}${esc(person.rating)}</span>`,
      `<span>${esc(person.reviewsCount)} reviews</span>`,
      `<span>${icon("map-pin")} ${esc(person.location)}</span>`,
      `<span>${icon("clock")} ${esc(person.availability)}</span>`,
      `<span>Member since ${esc(person.joined)}</span>`
    ].join("");

    const skills = (person.skills || [])
      .map((skill) => `<span class="tag">${esc(skill)}</span>`)
      .join("");

    const languages = (person.languages || [])
      .map((language) => `<li>${esc(language)}</li>`)
      .join("");

    root.innerHTML = `
      <div class="detail__main">
        <article class="panel">
          <header class="profile-head">
            <img class="profile-head__avatar" src="${esc(person.image)}" alt="${esc(
      person.name
    )}" width="92" height="92" />
            <div class="profile-head__id">
              <span class="badge badge--soft">${esc(person.level)}</span>
              <h1 class="detail__title">${esc(person.name)}</h1>
              <div class="detail__meta">
                <span>${esc(person.role)} · ${esc(person.category)}</span>
              </div>
              <div class="detail__meta">${meta}</div>
            </div>
            <div class="profile-head__actions">
              <a class="btn btn--primary" href="join.html">Hire ${esc(
                person.name.split(" ")[0]
              )}</a>
              <a class="btn btn--secondary" href="login.html">Message</a>
            </div>
          </header>

          <div class="profile-stats">
            <div class="profile-stat">
              <span class="profile-stat__value">${esc(person.stats.completed)}</span>
              <span class="profile-stat__label">Projects completed</span>
            </div>
            <div class="profile-stat">
              <span class="profile-stat__value">${esc(person.stats.onTime)}%</span>
              <span class="profile-stat__label">Delivered on time</span>
            </div>
            <div class="profile-stat">
              <span class="profile-stat__value">${esc(person.stats.repeat)}%</span>
              <span class="profile-stat__label">Repeat clients</span>
            </div>
          </div>

          <section class="detail__block">
            <h2>About</h2>
            <p>${esc(person.bio)}</p>
          </section>

          <section class="detail__block">
            <h2>Skills</h2>
            <div class="tag-list">${skills}</div>
          </section>

          <section class="detail__block">
            <h2>Languages</h2>
            <ul class="spec-list">${languages}</ul>
          </section>

          ${servicesBlock(person, services)}

          <section class="detail__block" id="reviews">
            <h2>Client reviews</h2>
            ${Components.RatingSummary(person.rating, person.reviewsCount)}
            ${Components.ReviewList(person.reviews)}
          </section>
        </article>
      </div>

      <aside class="detail__side" aria-label="Hire this freelancer">
        <div class="price-card">
          <p class="price-card__label">Hourly rate</p>
          <p class="price-card__price">${esc(person.rate)} <span>/hr</span></p>

          <ul class="price-card__meta">
            <li>
              <span class="price-card__row">${icon("clock")} Availability</span>
              <strong>${esc(person.availability)}</strong>
            </li>
            <li>
              <span class="price-card__row">${icon("map-pin")} Location</span>
              <strong>${esc(person.location)}</strong>
            </li>
            <li>
              <span class="price-card__row">${icon("shield")} Level</span>
              <strong>${esc(person.level)}</strong>
            </li>
          </ul>

          <a class="btn btn--primary" href="join.html">Hire ${esc(
            person.name.split(" ")[0]
          )}</a>
          <a class="btn btn--secondary" href="login.html">Send a message</a>
          <p class="price-card__note">Hiring through SkillMarket keeps every payment and message in one place.</p>
        </div>

        <div class="side-card">
          <h3>Quick facts</h3>
          <ul class="side-card__list">
            <li><span>Member since</span><strong>${esc(person.joined)}</strong></li>
            <li><span>Projects</span><strong>${esc(person.stats.completed)}</strong></li>
            <li><span>On time</span><strong>${esc(person.stats.onTime)}%</strong></li>
            <li><span>Repeat clients</span><strong>${esc(person.stats.repeat)}%</strong></li>
            <li><span>Rating</span><strong>${esc(person.rating)} / 5</strong></li>
          </ul>
        </div>
      </aside>`;
  }

  function renderRelated(person, freelancers) {
    const section = $("[data-related-section]");
    const grid = $("[data-related]");
    if (!section || !grid) return;

    const related = freelancers.items
      .filter((item) => item.id !== person.id)
      .sort(
        (a, b) =>
          (b.category === person.category) - (a.category === person.category) ||
          b.rating - a.rating
      )
      .slice(0, 3);

    if (!related.length) return;

    grid.innerHTML = related.map(Components.FreelancerCard).join("");
    section.removeAttribute("hidden");
  }

  Data.getAll(["freelancers", "services", "site"])
    .then(([freelancers, services, site]) => {
      const person = freelancers.items.find((item) => item.id === id);

      if (!person) {
        notFound("That profile does not exist — it may have been removed.");
        return;
      }

      document.title = `${person.name} · SkillMarket`;

      const parent = $("[data-crumb-parent]");
      const current = $("[data-crumb-current]");
      if (parent) {
        parent.textContent = person.category;
        parent.href = "freelancers.html";
      }
      if (current) current.textContent = person.name;

      render(person, services);
      renderRelated(person, freelancers);

      const cta = $("[data-cta]");
      if (cta && site && site.cta) cta.innerHTML = Components.Cta(site.cta);
    })
    .catch((error) => {
      console.error(error);
      notFound("We could not load this profile right now.");
    });
})();
