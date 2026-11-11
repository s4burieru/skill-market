/* Service detail page: renders the service, its seller and its reviews. */
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
        <h1>Service not found</h1>
        <p>${esc(message)}</p>
        <a class="btn btn--primary" href="explore.html">Back to all services</a>
      </div>`;
  }

  function sellerBlock(seller) {
    if (!seller) return "";

    return `
      <section class="detail__block">
        <h2>About the seller</h2>
        <div class="mini-card">
          <img src="${esc(seller.image)}" alt="${esc(seller.name)}" width="46" height="46" />
          <div class="mini-card__id">
            <p class="mini-card__name">${esc(seller.name)}</p>
            <p class="mini-card__role">${esc(seller.role)} · ${esc(seller.rate)}/hr · ${esc(
      seller.location
    )}</p>
          </div>
          <a class="btn btn--secondary btn--sm" href="freelancer-details.html?id=${esc(
            seller.id
          )}">View profile</a>
        </div>
      </section>`;
  }

  function render(service, seller) {
    const root = $("[data-detail-root]");

    const meta = [
      `<span class="rating">${icon("star")}${esc(service.rating)}</span>`,
      `<span>${esc(service.reviewsCount)} reviews</span>`,
      `<span>${icon("clock")} ${esc(service.delivery)} delivery</span>`,
      `<span>${esc(service.revisions)} revisions</span>`,
      seller ? `<a href="freelancer-details.html?id=${esc(seller.id)}">${esc(seller.name)}</a>` : ""
    ]
      .filter(Boolean)
      .join("");

    const features = (service.features || [])
      .map((feature) => `<li>${esc(feature)}</li>`)
      .join("");

    root.innerHTML = `
      <div class="detail__main">
        <article class="panel">
          <header class="detail__head">
            <span class="badge badge--soft">${esc(service.category)}</span>
            <h1 class="detail__title">${esc(service.title)}</h1>
            <div class="detail__meta">${meta}</div>
          </header>

          <img class="detail__media" src="${esc(service.image)}" alt="${esc(
      service.title
    )}" width="800" height="450" />

          <section class="detail__block">
            <h2>About this service</h2>
            <p>${esc(service.about)}</p>
          </section>

          <section class="detail__block">
            <h2>What's included</h2>
            <ul class="checklist">${features}</ul>
          </section>

          ${sellerBlock(seller)}

          <section class="detail__block" id="reviews">
            <h2>Client reviews</h2>
            ${Components.RatingSummary(service.rating, service.reviewsCount)}
            ${Components.ReviewList(service.reviews)}
          </section>
        </article>
      </div>

      <aside class="detail__side" aria-label="Order summary">
        <div class="price-card">
          <p class="price-card__label">Starting at</p>
          <p class="price-card__price">${esc(service.price.min)} - ${esc(
      service.price.max
    )}</p>

          <ul class="price-card__meta">
            <li>
              <span class="price-card__row">${icon("clock")} Delivery</span>
              <strong>${esc(service.delivery)}</strong>
            </li>
            <li>
              <span class="price-card__row">${icon("file-text")} Revisions</span>
              <strong>${esc(service.revisions)}</strong>
            </li>
            <li>
              <span class="price-card__row">${icon("shield")} Protection</span>
              <strong>Escrow included</strong>
            </li>
          </ul>

          <a class="btn btn--primary" href="join.html">Continue to order</a>
          <a class="btn btn--secondary" href="login.html">Contact seller</a>
          <p class="price-card__note">Funds are held in escrow and only released once you approve the work.</p>
        </div>
      </aside>`;
  }

  function renderRelated(service, services) {
    const section = $("[data-related-section]");
    const grid = $("[data-related]");
    if (!section || !grid) return;

    const related = services.items
      .filter((item) => item.id !== service.id)
      .sort(
        (a, b) =>
          (b.category === service.category) - (a.category === service.category) ||
          (b.popular ? 1 : 0) - (a.popular ? 1 : 0)
      )
      .slice(0, 3);

    if (!related.length) return;

    grid.innerHTML = related.map(Components.ServiceCard).join("");
    section.removeAttribute("hidden");
  }

  Data.getAll(["services", "freelancers", "site"])
    .then(([services, freelancers, site]) => {
      const service = services.items.find((item) => item.id === id);

      if (!service) {
        notFound("That service does not exist — it may have been removed.");
        return;
      }

      document.title = `${service.title} · SkillMarket`;

      const parent = $("[data-crumb-parent]");
      const current = $("[data-crumb-current]");
      if (parent) {
        parent.textContent = service.category;
        parent.href = "explore.html";
      }
      if (current) current.textContent = service.title;

      const seller = freelancers.items.find((person) => person.id === service.seller);

      render(service, seller);
      renderRelated(service, services);

      const cta = $("[data-cta]");
      if (cta && site && site.cta) cta.innerHTML = Components.Cta(site.cta);
    })
    .catch((error) => {
      console.error(error);
      notFound("We could not load this listing right now.");
    });
})();
