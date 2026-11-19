/* SkillMarket icon set: hand-drawn filled glyphs on a 24px grid. */
const Icons = (() => {
  const paths = {
    star: '<path d="M12 2.6 14.7 8.4l6.2.7-4.6 4.2 1.2 6.1L12 17l-5.5 3.4 1.2-6.1-4.6-4.2 6.2-.7L12 2.6Z"/>',
    menu: '<rect x="4" y="6.2" width="16" height="2.5" rx="1.25"/><rect x="4" y="10.75" width="16" height="2.5" rx="1.25"/><rect x="4" y="15.3" width="16" height="2.5" rx="1.25"/>',
    close: '<rect x="4" y="10.9" width="16" height="2.2" rx="1.1" transform="rotate(45 12 12)"/><rect x="4" y="10.9" width="16" height="2.2" rx="1.1" transform="rotate(-45 12 12)"/>',
    wallet: '<path fill-rule="evenodd" d="M5 5.5h13A2.5 2.5 0 0 1 20.5 8v9a2.5 2.5 0 0 1-2.5 2.5H5A2.5 2.5 0 0 1 2.5 17V8A2.5 2.5 0 0 1 5 5.5ZM11.6 10.2h7.7a1.15 1.15 0 0 1 1.15 1.15v2.3a1.15 1.15 0 0 1-1.15 1.15h-7.7a1.3 1.3 0 0 1-1.3-1.3v-2a1.3 1.3 0 0 1 1.3-1.3Z"/><circle cx="15.4" cy="12.5" r="1.1"/>',
    "map-pin": '<path fill-rule="evenodd" d="M12 2.5a7.2 7.2 0 0 1 7.2 7.2c0 4.6-4.4 9.6-6.3 11.2a1.35 1.35 0 0 1-1.8 0c-1.9-1.6-6.3-6.6-6.3-11.2A7.2 7.2 0 0 1 12 2.5Zm0 4.05a3.15 3.15 0 1 0 0 6.3 3.15 3.15 0 0 0 0-6.3Z"/>',
    clock: '<path fill-rule="evenodd" d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19Zm.95 4.35a1.25 1.25 0 0 0-2.5 0v5.85a1.25 1.25 0 0 0 .63 1.09l3.6 2.1a1.25 1.25 0 0 0 1.25-2.17l-2.98-1.74V6.85Z"/>',
    calendar: '<path fill-rule="evenodd" d="M5 4.5h14A2.5 2.5 0 0 1 21.5 7v12a2.5 2.5 0 0 1-2.5 2.5H5A2.5 2.5 0 0 1 2.5 19V7A2.5 2.5 0 0 1 5 4.5Zm-.9 5.3a1.15 1.15 0 0 0 0 2.3h15.8a1.15 1.15 0 0 0 0-2.3H4.1Zm1.5 5.4a1.15 1.15 0 0 0 0 2.3h6a1.15 1.15 0 0 0 0-2.3h-6Z"/><rect x="7.2" y="2" width="2.3" height="4.6" rx="1.15"/><rect x="14.5" y="2" width="2.3" height="4.6" rx="1.15"/>',
    "trending-up": '<path d="M3.31 18.31 9.7 11.93l3.5 3.5L21.81 6.81 20.19 5.19 13.2 12.17 9.7 8.67 1.69 16.69Z"/><path d="M22.84 4.16 23.4 8.4 18.6 3.6Z"/>',
    grid: '<rect x="3.5" y="3.5" width="7.4" height="7.4" rx="1.8"/><rect x="13.1" y="3.5" width="7.4" height="7.4" rx="1.8"/><rect x="13.1" y="13.1" width="7.4" height="7.4" rx="1.8"/><rect x="3.5" y="13.1" width="7.4" height="7.4" rx="1.8"/>',
    "chevron-down": '<path d="M6.15 9.2a1.5 1.5 0 0 1 2.15 0L12 13l3.7-3.8a1.5 1.5 0 0 1 2.15 2.1l-4.75 4.9a1.5 1.5 0 0 1-2.2 0l-4.75-4.9a1.5 1.5 0 0 1 0-2.1Z"/>',
    crown: '<path d="M3.6 8.3 8 11.7 12 5l4 6.7 4.4-3.4-1.4 8.6a1.6 1.6 0 0 1-1.57 1.4H6.57A1.6 1.6 0 0 1 5 16.9L3.6 8.3Z"/>',
    gem: '<path d="M8.2 3h7.6l4.4 6.3L12 21.6 3.8 9.3 8.2 3Z"/><path fill-opacity=".35" d="M12 21.6 9.4 9.3h5.2L12 21.6Z"/>',
    "badge-check": '<path fill-rule="evenodd" d="M8.2 2.8h7.6l4.4 4.4v7.6l-4.4 4.4H8.2l-4.4-4.4V7.2L8.2 2.8Zm2.15 11.9-2.45-2.5 1.55-1.55 1.05 1.05 4-4 1.55 1.55-5.7 5.45Z"/>',
    "shield-check": '<path fill-rule="evenodd" d="M12 2.2 19 5.6a1.6 1.6 0 0 1 1 1.5v5.3c0 5.1-3.1 8.7-8 9.9-4.9-1.2-8-4.8-8-9.9V7.1a1.6 1.6 0 0 1 1-1.5L12 2.2Zm-1.15 12.75-2.9-2.9 1.7-1.7 1.2 1.2 4.05-4 1.7 1.7-5.75 5.7Z"/>',
    bell: '<path d="M12 2.8a6.3 6.3 0 0 1 6.3 6.3v4.02l1.44 3.16a1.25 1.25 0 0 1-1.16 1.72H5.42a1.25 1.25 0 0 1-1.16-1.72L5.7 13.12v-4A6.3 6.3 0 0 1 12 2.8Z"/><path d="M9.55 19.6a2.55 2.55 0 0 0 4.9 0Z"/>',
    inbox: '<path d="M4.5 4.3h15a1.4 1.4 0 0 1 0 2.8h-15a1.4 1.4 0 0 1 0-2.8Z"/><path d="M2.8 10a1.6 1.6 0 0 1 1.6-1.6h15.2a1.6 1.6 0 0 1 1.6 1.6v6.3a2.4 2.4 0 0 1-2.4 2.4H5.2a2.4 2.4 0 0 1-2.4-2.4V10Z"/>',
    folder: '<path d="M3 7.2A2.7 2.7 0 0 1 5.7 4.5h4.1a2 2 0 0 1 1.6.8l1.5 2a2 2 0 0 0 1.6.8h4.8A2.7 2.7 0 0 1 22 10.8v6.5a2.7 2.7 0 0 1-2.7 2.7H5.7A2.7 2.7 0 0 1 3 17.3V7.2Z"/>',
    "file-text": '<path fill-rule="evenodd" d="M7.3 2.5h5.1l6 6V22a2.1 2.1 0 0 1-2.1 2.1H7.3a2.1 2.1 0 0 1-2.1-2.1V4.6a2.1 2.1 0 0 1 2.1-2.1Zm2 10.5a1.15 1.15 0 0 0 0 2.3h5.4a1.15 1.15 0 0 0 0-2.3H9.3Zm0-3.7a1.15 1.15 0 0 0 0 2.3h5.4a1.15 1.15 0 0 0 0-2.3H9.3Z"/><path fill-opacity=".4" d="M12.4 2.5v5.1a.9.9 0 0 0 .9.9h5.1L12.4 2.5Z"/>',
    message: '<path d="M12 3C6.9 3 3 6.6 3 12c0 2 .7 3.9 1.9 5.4.34.5.1 1.4-.7 2.4 2.6.2 4.6-.7 6-1.6.8.2 1.7.3 2.8.3 5.1 0 9-3.6 9-9S17.1 3 12 3Z"/>',
    "bar-chart": '<rect x="4" y="12" width="4.1" height="7.5" rx="1.2"/><rect x="10.15" y="7.2" width="4.1" height="12.3" rx="1.2"/><rect x="16.3" y="3.5" width="4.1" height="16" rx="1.2"/>',
    user: '<circle cx="12" cy="7.6" r="4.1"/><path d="M4.5 20.4a7.5 7.5 0 0 1 15 0 1.2 1.2 0 0 1-1.2 1.5H5.7a1.2 1.2 0 0 1-1.2-1.5Z"/>',
    users: '<circle cx="9.3" cy="8.2" r="3.4"/><path d="M3.4 19.6a6 6 0 0 1 11.8 0 1.1 1.1 0 0 1-1.1 1.4H4.5a1.1 1.1 0 0 1-1.1-1.4Z"/><circle cx="16.7" cy="9" r="2.7" fill-opacity=".55"/><path fill-opacity=".55" d="M15.3 14.2a6 6 0 0 1 5 6.35 1.15 1.15 0 0 1-1.2 1.15h-2.5a7.4 7.4 0 0 0-1.3-7.5Z"/>',
    shield: '<path d="M12 2.2 19 5.6a1.6 1.6 0 0 1 1 1.5v5.3c0 5.1-3.1 8.7-8 9.9-4.9-1.2-8-4.8-8-9.9V7.1a1.6 1.6 0 0 1 1-1.5L12 2.2Z"/>',
    flag: '<path d="M4.5 3.5a1.5 1.5 0 0 1 3 0v1.1h9.6a1.3 1.3 0 0 1 1 2.2l-2.8 3.3 2.8 3.3a1.3 1.3 0 0 1-1 2.2H7.5v4.3a1.5 1.5 0 0 1-3 0V3.5Z"/>',
    settings: '<path fill-rule="evenodd" d="M12 6.1a5.9 5.9 0 1 1 0 11.8 5.9 5.9 0 0 1 0-11.8Zm0 2.7a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z"/><rect x="10.6" y="1.7" width="2.8" height="4.4" rx="1.2"/><rect x="10.6" y="17.9" width="2.8" height="4.4" rx="1.2"/><rect x="1.7" y="10.6" width="4.4" height="2.8" rx="1.2"/><rect x="17.9" y="10.6" width="4.4" height="2.8" rx="1.2"/><rect x="10.6" y="1.7" width="2.8" height="4.4" rx="1.2" transform="rotate(45 12 12)"/><rect x="10.6" y="1.7" width="2.8" height="4.4" rx="1.2" transform="rotate(-45 12 12)"/><rect x="10.6" y="1.7" width="2.8" height="4.4" rx="1.2" transform="rotate(135 12 12)"/><rect x="10.6" y="1.7" width="2.8" height="4.4" rx="1.2" transform="rotate(225 12 12)"/>',
    help: '<path d="M6.22 11.06A6.15 6.15 0 1 1 12.62 15.32A1.35 1.35 0 0 1 12.42 12.72A3.45 3.45 0 1 0 8.75 10.18A1.35 1.35 0 0 1 6.22 11.06Z"/><circle cx="12" cy="18.9" r="1.7"/>',
    "log-out": '<path fill-rule="evenodd" d="M10.3 2.5h7.2A2.5 2.5 0 0 1 20 5v14a2.5 2.5 0 0 1-2.5 2.5h-7.2a1.4 1.4 0 1 1 0-2.8h6.4V5.3h-6.4a1.4 1.4 0 1 1 0-2.8Z"/><path d="M2.6 12a1.35 1.35 0 0 1 1.35-1.35h8l-1.9-1.95a1.35 1.35 0 0 1 1.9-1.9l4.9 4.9a1.35 1.35 0 0 1 0 1.9l-4.9 4.9a1.35 1.35 0 0 1-1.9-1.9l1.9-1.9h-8A1.35 1.35 0 0 1 2.6 12Z"/>',
    check: '<path d="M20 6.3a1.5 1.5 0 0 1 .15 2.1l-9.2 10.6a1.5 1.5 0 0 1-2.25.08L3.6 12.9a1.5 1.5 0 0 1 2.2-2l4 4.3L17.8 6a1.5 1.5 0 0 1 2.2.3Z"/>',
    "check-circle": '<path fill-rule="evenodd" d="M12 2.3a9.7 9.7 0 1 0 0 19.4 9.7 9.7 0 0 0 0-19.4ZM9.2 11.9l1.9 1.9 4.6-5 1.7 1.6-6.3 6.8-3.6-3.6 1.7-1.7Z"/>',
    search: '<path fill-rule="evenodd" d="M10.4 3.2a7.2 7.2 0 1 1 0 14.4 7.2 7.2 0 0 1 0-14.4Zm0 2.5a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Z"/><rect x="13.85" y="16.3" width="7.5" height="2.6" rx="1.3" transform="rotate(45 17.6 17.6)"/>',
    send: '<path d="M21.5 2.5 3.1 10.9a1.4 1.4 0 0 0 .15 2.62l6.7 2.4 2.5 6.8a1.4 1.4 0 0 0 2.6.3l6.6-17.5a1.4 1.4 0 0 0-.2-2.9Z"/>',
    eye: '<path fill-rule="evenodd" d="M12 5.5c5.5 0 8.9 4.7 9.8 6.5-.9 1.8-4.3 6.5-9.8 6.5S3.1 13.8 2.2 12c.9-1.8 4.3-6.5 9.8-6.5Zm0 2.6a3.9 3.9 0 1 0 0 7.8 3.9 3.9 0 0 0 0-7.8Z"/>',
    "eye-off": '<path fill-rule="evenodd" d="M12 5.5c5.5 0 8.9 4.7 9.8 6.5-.9 1.8-4.3 6.5-9.8 6.5S3.1 13.8 2.2 12c.9-1.8 4.3-6.5 9.8-6.5Zm0 2.6a3.9 3.9 0 1 0 0 7.8 3.9 3.9 0 0 0 0-7.8Z"/><rect x="2.6" y="11" width="18.8" height="2.1" rx="1.05" transform="rotate(-45 12 12)"/>',
    "file-plus": '<path d="M7.3 2.5h5.1l6 6V22a2.1 2.1 0 0 1-2.1 2.1H7.3a2.1 2.1 0 0 1-2.1-2.1V4.6a2.1 2.1 0 0 1 2.1-2.1Z"/><path fill-opacity=".55" d="M13.3 10.6h1.6a.8.8 0 0 1 .8.8v2.4h2.4a.8.8 0 0 1 .8.8v1.6a.8.8 0 0 1-.8.8h-2.4v2.4a.8.8 0 0 1-.8.8h-1.6a.8.8 0 0 1-.8-.8v-2.4H9.8a.8.8 0 0 1-.8-.8v-1.6a.8.8 0 0 1 .8-.8h2.7v-2.4a.8.8 0 0 1 .8-.8Z"/>',
    briefcase: '<path d="M5.2 8h13.6A2.2 2.2 0 0 1 21 10.2v8.6a2.7 2.7 0 0 1-2.7 2.7H5.7A2.7 2.7 0 0 1 3 18.8v-8.6A2.2 2.2 0 0 1 5.2 8Z"/><rect x="8" y="3" width="8" height="3.2" rx="1.6"/><path fill-opacity=".38" d="M3 12.2h6.3a.9.9 0 0 1 .8.55 2.9 2.9 0 0 0 4.6 0 .9.9 0 0 1 .8-.55H21v1.65h-5a4.4 4.4 0 0 1-4.4 3.2 4.4 4.4 0 0 1-4.4-3.2H3v-1.65Z"/>',
    "arrow-up": '<path d="M12 3.2 20.4 12.2h-4.2V20a1.6 1.6 0 0 1-1.6 1.6H9.4A1.6 1.6 0 0 1 7.8 20v-7.8H3.6L12 3.2Z"/>',
    "arrow-right": '<rect x="2.6" y="10.7" width="12.4" height="2.6" rx="1.3"/><path d="M12.2 4.6 21.8 12l-9.6 7.4Z"/>'
  };

  function svg(name, className = "") {
    const markup = paths[name];
    if (!markup) return "";
    return `<svg class="icon${className ? ` ${className}` : ""}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${markup}</svg>`;
  }

  return { svg, path: (name) => paths[name] || "" };
})();

/* Marketplace ranking, recomputed each render. Score (max 100):
   rating*14 + min(reviews,150)*.12 + min(completed,150)*.08.
   Ranked within category; Premium never overrides the score. */
const Ranking = (() => {
  function score(person) {
    const rating = Number(person.rating) || 0;
    const reviews = Math.min(Number(person.reviewsCount) || 0, 150);
    const completed =
      Math.min(Number(person.stats && person.stats.completed) || 0, 150);
    return Math.round(rating * 14 + reviews * 0.12 + completed * 0.08);
  }

  function compare(a, b) {
    return (
      b.score - a.score ||
      (Number(b.rating) || 0) - (Number(a.rating) || 0) ||
      (Number(b.reviewsCount) || 0) - (Number(a.reviewsCount) || 0) ||
      String(a.name).localeCompare(String(b.name))
    );
  }

  const categoryKey = (person) =>
    String((person && person.category) || "").trim().toLowerCase() || "uncategorized";

  function ranked(list) {
    const scored = [...(list || [])].map((person) => ({
      ...person,
      score: score(person)
    }));

    const groups = new Map();
    for (const person of scored) {
      const key = categoryKey(person);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(person);
    }

    for (const group of groups.values()) {
      group
        .sort(compare)
        .forEach((person, index) => {
          person.rank = index + 1;
        });
    }

    // Leaders first: every category #1, then #2s, best score first.
    return scored.sort((a, b) => a.rank - b.rank || compare(a, b));
  }

  function medal(rank) {
    if (rank === 1) return "gold";
    if (rank === 2) return "silver";
    if (rank === 3) return "bronze";
    return null;
  }

  function tier(rank) {
    if (rank === 1) return "Top Freelancer";
    if (rank === 2) return "Silver Crown";
    if (rank === 3) return "Bronze Crown";
    return null;
  }

  return { score, ranked, medal, tier };
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

  function VerifiedSeal(className = "") {
    return `<svg class="verified-seal${className ? ` ${className}` : ""}" viewBox="0 0 24 24" role="img" aria-label="Identity verified by SkillMarket">
      <path fill="currentColor" fill-rule="evenodd" d="M7.9 2.6h8.2l5.3 5.3v8.2l-5.3 5.3H7.9l-5.3-5.3V7.9l5.3-5.3Zm3.05 12.5 6.1-6.25-1.75-1.75-4.35 4.5-1.85-1.85-1.75 1.75 3.6 3.6Z"/>
    </svg>`;
  }

  function FreelancerCard(person) {
    const rank = person.rank || null;
    const medal = rank ? Ranking.medal(rank) : null;
    const score = person.score;
    const reviews = Number(person.reviewsCount) || 0;
    const completed = Number(person.stats && person.stats.completed) || 0;
    const skills = Array.isArray(person.skills) ? person.skills : [];
    const shownSkills = skills.slice(0, 2);
    const extraSkills = skills.length - shownSkills.length;
    const availableNow = String(person.availability || "")
      .trim()
      .toLowerCase()
      .startsWith("available now");

    const crown = medal
      ? `<span class="fl__crown fl__crown--${medal}" title="#${rank} in ${esc(
          person.category
        )} · Marketplace score: ${esc(score)} of 100">${Icons.svg(
          "crown"
        )}<span class="fl__crown-num">#${rank}</span></span>`
      : "";

    const premium = person.premium
      ? `<span class="fl__premium" title="Premium member, boosted placement in search">${Icons.svg(
          "gem"
        )}Premium</span>`
      : "";

    const rankChip =
      rank && !medal
        ? `<span class="fl__rank" title="#${rank} in ${esc(
            person.category
          )} · Marketplace score: ${esc(score)} of 100">#${rank}</span>`
        : "";

    const skillChips = shownSkills
      .map((skill) => `<li class="fl__skill">${esc(skill)}</li>`)
      .join("");
    const extraChip =
      extraSkills > 0
        ? `<li class="fl__skill fl__skill--more" title="${esc(skills.slice(2).join(", "))}">+${extraSkills}</li>`
        : "";

    return `
      <article class="card card--freelancer${person.premium ? " card--premium" : ""}">
        <div class="fl__topline">
          <span class="fl__category">${esc(person.category)}</span>
          <span class="fl__flags">${rankChip}${premium}</span>
        </div>
        <div class="fl__main">
          <div class="fl__avatar">
            <img src="${esc(person.image)}" alt="${esc(person.name)}" loading="lazy" width="600" height="600" />
            ${crown}
          </div>
          <div class="fl__id">
            <h3 class="fl__name" title="${esc(person.name)}"><span class="fl__name-text">${esc(
              person.name
            )}${person.verified ? VerifiedSeal() : ""}</span></h3>
            <p class="fl__role" title="${esc(person.role)}">${esc(person.role)}</p>
            <p class="fl__meta">${Icons.svg("star", "fl__star")}<strong>${esc(
              person.rating
            )}</strong><span class="fl__reviews">(${esc(reviews)})</span><span class="fl__sep" aria-hidden="true"></span><span>${esc(
              completed
            )} jobs</span></p>
            <p class="fl__avail${availableNow ? " fl__avail--now" : ""}"><span class="fl__avail-dot" aria-hidden="true"></span>${esc(
              person.availability || "Availability on request"
            )}</p>
          </div>
        </div>
        ${
          skillChips
            ? `<ul class="fl__skills" aria-label="Top skills">${skillChips}${extraChip}</ul>`
            : ""
        }
        <div class="fl__footer">
          <span class="fl__rate"><span class="fl__rate-value">${esc(
            person.rate
          )}<span class="fl__rate-unit">/hr</span></span><span class="fl__rate-label">Hourly rate</span></span>
          <a class="btn btn--primary btn--sm fl__cta" href="freelancer-details.html?id=${esc(
            person.id
          )}" aria-label="View ${esc(person.name)}&rsquo;s profile">View${Icons.svg(
            "arrow-right",
            "fl__cta-icon"
          )}</a>
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

  /* Reviews */

  function StarRow(rating) {
    const value = Number(rating) || 0;
    const stars = [1, 2, 3, 4, 5]
      .map((i) => {
        const on = value >= i - 0.25;
        return `<svg class="star${on ? " star--on" : ""}" viewBox="0 0 24 24"
          fill="currentColor" aria-hidden="true">${Icons.path("star")}</svg>`;
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
      return `<p class="empty-state">No reviews yet. Be the first to leave one.</p>`;
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
    linkList,
    esc,
    StarRow,
    ReviewItem,
    ReviewList,
    RatingSummary,
    VerifiedSeal,
    rankedList: Ranking.ranked,
    rankTier: Ranking.tier
  };
})();
