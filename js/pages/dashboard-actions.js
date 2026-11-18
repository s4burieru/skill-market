/**
 * Dashboard action layer, shared by freelancer-dashboard.html,
 * hire-talent-dashboard.html and super-admin-dashboard.html.
 *
 * Everything clickable that is not a plain section link lives here:
 * dialogs (settings, help, inbox, money forms, queues), the notification
 * and account menus, the toasts that confirm an action, and the row-level
 * "open this item" details. Content is picked from the signed-in role
 * (freelancer / hire-talent / super-admin), so one script powers all
 * three dashboards.
 *
 * Plain HTML, CSS and JavaScript: no frameworks, one shared overlay and a
 * toast stack appended to <body>.
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

  const CHECK = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20 6.3a1.5 1.5 0 0 1 .15 2.1l-9.2 10.6a1.5 1.5 0 0 1-2.25.08L3.6 12.9a1.5 1.5 0 0 1 2.2-2l4 4.3L17.8 6a1.5 1.5 0 0 1 2.2.3Z"/></svg>`;

  const account = () => Session.get() || { name: "", email: "", role: "freelancer" };
  const role = () => account().role || "freelancer";

  const initials = (name) =>
    String(name || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");

  const peso = (value) => `₱${Math.round(Number(value) || 0).toLocaleString("en-US")}`;
  const number = (text) => Number(String(text || "").replace(/[^0-9.]/g, "")) || 0;
  const ref = () => String(Math.floor(10000 + Math.random() * 90000));

  /* --- Toasts ---------------------------------------------------------- */

  function toast(text, title) {
    let host = $(".toasts");
    if (!host) {
      host = document.createElement("div");
      host.className = "toasts";
      host.setAttribute("role", "status");
      host.setAttribute("aria-live", "polite");
      document.body.appendChild(host);
    }

    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `
      <span class="toast__mark" aria-hidden="true"></span>
      <div class="toast__body">
        ${title ? `<p class="toast__title">${esc(title)}</p>` : ""}
        <p class="toast__text">${esc(text)}</p>
      </div>`;
    host.appendChild(el);

    window.setTimeout(() => {
      el.classList.add("is-out");
      window.setTimeout(() => el.remove(), 300);
    }, 4200);
  }

  /* --- Modal ----------------------------------------------------------- */

  let handlers = {};
  let lastFocus = null;

  function overlay() {
    let root = $("[data-modal]");
    if (root) return root;

    root = document.createElement("div");
    root.className = "modal";
    root.setAttribute("data-modal", "");
    root.hidden = true;
    root.innerHTML = `
      <div class="modal__backdrop" data-modal-close></div>
      <div class="modal__card" role="dialog" aria-modal="true" aria-labelledby="dash-modal-title">
        <header class="modal__head">
          <div class="modal__head-text">
            <p class="modal__eyebrow" data-modal-eyebrow></p>
            <h2 class="modal__title" id="dash-modal-title" data-modal-title></h2>
          </div>
          <button class="modal__close" type="button" data-modal-close aria-label="Close dialog">${Icons.svg("close")}</button>
        </header>
        <div class="modal__body" data-modal-body></div>
        <footer class="modal__foot" data-modal-foot hidden></footer>
      </div>`;
    document.body.appendChild(root);

    // One delegated listener: closers and any [data-mact] control inside
    // the card route through the handlers of the currently open dialog.
    root.addEventListener("click", (event) => {
      if (event.target.closest("[data-modal-close]")) {
        closeModal();
        return;
      }

      const trigger = event.target.closest("[data-mact]");
      if (!trigger || !root.contains(trigger)) return;
      const run = handlers[trigger.dataset.mact];
      if (!run) return;
      event.preventDefault();
      run(trigger, root);
    });

    root.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeModal();
        return;
      }
      if (event.key !== "Tab") return;

      // Keep focus inside the card while it is open.
      const focusable = $$(
        'button:not([disabled]), a[href], input:not([type="hidden"]), select, textarea',
        root
      ).filter((el) => el.offsetParent !== null);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    return root;
  }

  function setBody(html) {
    $("[data-modal-body]", overlay()).innerHTML = html;
  }

  function setFoot(html) {
    const foot = $("[data-modal-foot]", overlay());
    foot.innerHTML = html || "";
    foot.hidden = !html;
  }

  function openModal(options) {
    const root = overlay();

    // Re-rendering an open dialog must not steal the trigger we return to.
    if (!root.contains(document.activeElement)) lastFocus = document.activeElement;

    handlers = options.handlers || {};
    $("[data-modal-eyebrow]", root).textContent = options.eyebrow || "";
    $("[data-modal-title]", root).textContent = options.title || "";
    setBody(options.html || "");
    setFoot(options.foot || "");

    root.hidden = false;
    document.body.classList.add("is-modal-open");
    document.documentElement.classList.add("is-modal-open");

    if (typeof options.onOpen === "function") options.onOpen(root);

    const target = $$(
      "[data-modal-body] input, [data-modal-body] select, [data-modal-body] textarea," +
        " [data-modal-foot] input, [data-modal-foot] select, [data-modal-foot] textarea," +
        " [data-modal-body] button, [data-modal-foot] button",
      root
    ).find((el) => !el.disabled && el.offsetParent !== null);

    (target || $("[data-modal-close]", root)).focus();
    return root;
  }

  function closeModal() {
    const root = $("[data-modal]");
    if (!root || root.hidden) return;

    root.hidden = true;
    handlers = {};
    document.body.classList.remove("is-modal-open");
    document.documentElement.classList.remove("is-modal-open");

    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    lastFocus = null;
  }

  const closeFoot = (primary = "") =>
    `<button class="btn btn--secondary" type="button" data-modal-close>Close</button>${primary}`;

  function successModal(options) {
    openModal({
      eyebrow: options.eyebrow,
      title: options.title,
      html: `<div class="success">
        <span class="success__mark" aria-hidden="true">${CHECK}</span>
        <p class="success__title">${esc(options.heading)}</p>
        <p class="success__text">${options.text}</p>
      </div>`,
      foot: options.primary
        ? closeFoot(
            `<button class="btn btn--primary" type="button" data-mact="${options.primary.key}">${esc(
              options.primary.label
            )}</button>`
          )
        : `<button class="btn btn--primary" type="button" data-modal-close>Done</button>`,
      handlers: options.primary ? { [options.primary.key]: options.primary.run } : {}
    });
  }

  function fieldError(root, message) {
    const error = $("[data-field-error]", root);
    if (!error) return;
    error.textContent = message || "";
    error.hidden = !message;
  }

  /* --- Small page helpers --------------------------------------------- */

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }

  function changeStat(label, delta) {
    const stat = $$(".stats .stat").find(
      (item) => ($(".stat__label", item) || {}).textContent === label
    );
    if (!stat) return;
    const value = $(".stat__value", stat);
    if (!value) return;
    value.textContent = (number(value.textContent) + delta).toLocaleString("en-US");
  }

  function setStatus(row, label, tone) {
    const status = row && $(".status", row);
    if (!status) return;
    status.className = `status status--${tone}`;
    status.textContent = label;
  }

  function addActivity(title, icon) {
    const list = $("#activity .timeline");
    if (!list) return;

    const item = document.createElement("li");
    item.className = "timeline__item";
    item.innerHTML = `
      <span class="timeline__icon" aria-hidden="true">${Icons.svg(icon || "star")}</span>
      <div>
        <p class="timeline__title">${esc(title)}</p>
        <p class="timeline__time">Just now</p>
      </div>`;
    list.prepend(item);
  }

  const stripRow = (row) => {
    const copy = row.cloneNode(true);
    copy.removeAttribute("tabindex");
    copy.removeAttribute("role");
    copy.classList.remove("is-clickable");
    return copy.outerHTML;
  };

  const listRow = (item) => `
    <li class="list__item">
      <span class="avatar">${esc(item.initials)}</span>
      <div class="list__main">
        <p class="list__title">${esc(item.title)}</p>
        <p class="list__meta">${item.meta
          .map((part, i) => `${i ? `<span aria-hidden="true">·</span>` : ""}<span>${esc(part)}</span>`)
          .join("")}</p>
      </div>
      <div class="list__aside"><span class="status status--${item.tone}">${esc(item.status)}</span></div>
    </li>`;

  /* --- Per-role content ------------------------------------------------- */

  const SETTINGS = {
    freelancer: [
      { key: "matches", label: "New job matches by email", hint: "Three tailored gigs, every morning", on: true },
      { key: "replies", label: "Client reply alerts", hint: "The moment a client writes back", on: true },
      { key: "digest", label: "Weekly earnings summary", hint: "A Monday recap of payments and payouts", on: true },
      { key: "tips", label: "Profile improvement tips", hint: "Occasional suggestions to raise your ranking", on: false }
    ],
    "hire-talent": [
      { key: "applications", label: "New application alerts", hint: "Email me each time someone applies", on: true },
      { key: "milestones", label: "Milestone reminders", hint: "Two days before a milestone is due", on: true },
      { key: "digest", label: "Weekly hiring digest", hint: "Spend, contracts and open roles in one email", on: true },
      { key: "tips", label: "Hiring tips and product news", on: false }
    ],
    "super-admin": [
      { key: "queue", label: "Moderation queue alerts", hint: "When an item has waited over an hour", on: true },
      { key: "urgent", label: "Urgent report pings", hint: "Immediate email for reports marked urgent", on: true },
      { key: "audit", label: "Weekly audit summary", hint: "Every admin action taken on the platform", on: true },
      { key: "news", label: "Product news for admins", on: false }
    ]
  };

  const SECURITY = [
    { key: "2fa", label: "Two-factor authentication", hint: "Required for payouts and admin actions", on: true },
    { key: "audit", label: "Audit log", hint: "Keep every admin action for 90 days", on: true },
    { key: "ip", label: "IP allowlist", hint: "Only sign in from approved office ranges", on: false },
    { key: "alerts", label: "New device alerts", hint: "Email me when an unknown device signs in", on: true }
  ];

  const HELP = {
    freelancer: [
      ["How do I get paid?", "Milestones drop into your SkillMarket balance as soon as a client approves them. Withdraw to GCash, bank or PayPal. Most transfers clear in 1–2 business days."],
      ["Why was my proposal declined?", "Declined proposals still count toward your stats. Open the proposal from Recent proposals to read the short reason the client left."],
      ["How does ranking work?", "Rating, response time and completed contracts decide where you appear in search. A 100% profile gets the biggest lift of all."]
    ],
    "hire-talent": [
      ["How does escrow work?", "Funds you add sit in escrow and are only released when you approve a milestone. Unallocated escrow can be reclaimed at any time."],
      ["Can I reject a delivery?", "Yes. Open the project, review the delivery, then request changes or reject it. Payment stays in escrow until the issue is settled."],
      ["How do I post a better job?", "Briefs with a clear scope, a real budget and 3–5 skills get roughly twice as many applications."]
    ],
    "super-admin": [
      ["What happens when I approve an item?", "It leaves the queue, returns to search and is written to the audit trail with your name and timestamp for 90 days."],
      ["How are reports prioritised?", "Urgent reports (payment disputes, harassment) jump to the top and are emailed to every online admin."],
      ["Can I undo a suspension?", "Yes. Go to Users → suspended accounts → Reinstate. The original moderator is notified automatically."]
    ]
  };

  const NOTICES = {
    freelancer: [
      { icon: "message", title: "Michael Chen replied", text: "“Can you share the updated checkout screens?”", time: "12m", href: "messages.html#messages" },
      { icon: "folder", title: "Milestone due in 2 days", text: "Analytics dashboard MVP is sitting at 88%.", time: "1h", href: "projects.html#projects" },
      { icon: "wallet", title: "Payment received", text: "₱82,700 from Growth Hub cleared into your balance.", time: "Nov 2", href: "payments.html#payments" }
    ],
    "hire-talent": [
      { icon: "file-text", title: "12 new applications", text: "Senior React Developer picked up a dozen candidates overnight.", time: "3h", href: "applications.html#applications" },
      { icon: "message", title: "David Kim confirmed", text: "“Pipeline KPIs confirmed, starting the build Monday.”", time: "2h", href: "messages.html#messages" },
      { icon: "folder", title: "Milestone to approve", text: "Brand identity refresh is ready for your review.", time: "Nov 3", href: "projects.html#projects" }
    ],
    "super-admin": [
      { icon: "shield", title: "6 items need review", text: "The moderation queue has six items waiting.", time: "2h", href: "moderation.html#moderation" },
      { icon: "flag", title: "2 urgent reports unassigned", text: "Order #4821 and one harassment report.", time: "1h", href: "reports.html#reports" },
      { icon: "users", title: "312 new users this week", text: "48 of them are still awaiting verification.", time: "1d", href: "users.html#users" }
    ]
  };

  const PREVIEW = {
    freelancer: {
      eyebrow: "Public profile",
      roleLine: "Top-rated freelancer · Identity verified",
      bio: "I build fast, accessible storefronts and dashboards for growing teams. Eight years shipping React and Node, six years doing it on SkillMarket. Most clients come back for a second project.",
      tags: ["React", "Node.js", "TypeScript", "UI design", "API integration", "Performance"],
      stats: [["Rating", "4.9 / 5"], ["Completed", "42 contracts"], ["Response", "~1 hour"], ["Repeat clients", "68%"]],
      link: "freelancer-details.html?id=flw-001"
    },
    "hire-talent": {
      eyebrow: "Company profile",
      roleLine: "Verified business · Hiring since 2023",
      bio: "We are a 20-person product team shipping commerce and analytics tools. We hire specialists for defined milestones, pay on time and keep long-term retainers for the people who deliver.",
      tags: ["Web app", "Data pipeline", "SEO", "Brand design", "Retainers"],
      stats: [["Hires", "37"], ["Active", "8 contracts"], ["Rating", "4.8 / 5"], ["Rehired", "74%"]],
      link: "index.html#freelancers"
    },
    "super-admin": {
      eyebrow: "Admin profile",
      roleLine: "Super admin · Full platform access",
      bio: "Platform operator for SkillMarket. Oversees moderation, payments and the trust & safety queue, with two-factor authentication and a full audit trail on every action.",
      tags: ["Moderation", "Payments", "Users", "Audit", "Reports"],
      stats: [["Admin since", "2023"], ["Actions logged", "1,284"], ["Reports resolved", "98%"], ["Uptime", "99.9%"]],
      link: "index.html"
    }
  };

  const EXTRA = {
    freelancer: {
      projects: [
        { title: "Brand refresh · monthly retainer", client: "Lumen Studio", due: "Ongoing", pct: 100, tone: "muted", status: "Complete" },
        { title: "Checkout A/B experiments", client: "Corner Bakery", due: "Due Feb 3", pct: 15, tone: "info", status: "In review" }
      ],
      activity: [
        { icon: "star", title: "Review left · 5 stars on E-commerce checkout rebuild", time: "Oct 30" },
        { icon: "file-text", title: "Contract signed · Brand refresh retainer", time: "Oct 28" },
        { icon: "wallet", title: "Withdrawal completed · ₱54,000 to GCash", time: "Oct 26" },
        { icon: "message", title: "New message from Priya Raman", time: "Oct 25" }
      ],
      history: {
        columns: ["Date", "Reference", "Client", "Amount"],
        rows: [
          { cells: ["Nov 12", "TXN-4471", "Growth Hub · Milestone 2", "₱82,700"], status: { label: "Paid", tone: "ok" } },
          { cells: ["Nov 5", "TXN-4438", "TechFlow Inc. · Milestone 1", "₱64,500"], status: { label: "Paid", tone: "ok" } },
          { cells: ["Nov 3", "TXN-4415", "Design Studio · Consulting", "₱41,200"], status: { label: "Paid", tone: "ok" } },
          { cells: ["Nov 1", "TXN-4402", "Growth Hub · Retainer", "₱86,600"], status: { label: "Paid", tone: "ok" } },
          { cells: ["Oct 28", "TXN-4377", "Northwind Labs · Phase 1", "₱54,000"], status: { label: "Processing", tone: "warn" } },
          { cells: ["Oct 24", "TXN-4361", "Corner Bakery · Landing page", "₱48,000"], status: { label: "Paid", tone: "ok" } }
        ]
      }
    },
    "hire-talent": {
      projects: [
        { title: "Support desk migration", client: "Ops Team", due: "Due Jan 15", pct: 35, tone: "info", status: "In review" },
        { title: "Quarterly report automation", client: "Finance", due: "Due Dec 22", pct: 55, tone: "ok", status: "On track" }
      ],
      activity: [
        { icon: "file-text", title: "Job closed · WordPress Developer", time: "Nov 2" },
        { icon: "wallet", title: "Escrow funded · ₱150,000 for Q4 reports", time: "Oct 31" },
        { icon: "star", title: "Review left · 5 stars for Elena Rodriguez", time: "Oct 29" },
        { icon: "users", title: "Priya Raman added to the hiring team", time: "Oct 27" }
      ],
      invoices: {
        columns: ["Date", "Reference", "Contractor", "Amount"],
        rows: [
          { cells: ["Nov 12", "INV-2210", "David Kim · Data pipeline", "₱182,000"], status: { label: "Paid", tone: "ok" } },
          { cells: ["Nov 8", "INV-2204", "Sarah Jenkins · Website redesign", "₱146,000"], status: { label: "Paid", tone: "ok" } },
          { cells: ["Nov 5", "INV-2197", "Michael Chen · Brand identity", "₱98,000"], status: { label: "Due", tone: "warn" } },
          { cells: ["Nov 3", "INV-2190", "Elena Rodriguez · SEO program", "₱131,000"], status: { label: "Paid", tone: "ok" } },
          { cells: ["Nov 1", "INV-2184", "Priya Raman · Product UI", "₱150,000"], status: { label: "Paid", tone: "ok" } },
          { cells: ["Oct 27", "INV-2171", "Marcus Webb · Video editing", "₱72,000"], status: { label: "Refunded", tone: "muted" } }
        ]
      }
    },
    "super-admin": {
      activity: [
        { icon: "users", title: "New admin invited · modrina@skillmarket.com", time: "Oct 31" },
        { icon: "shield", title: "Service reinstated · Logo design bundle", time: "Oct 30" },
        { icon: "wallet", title: "Fee schedule updated · 10% on new contracts", time: "Oct 29" },
        { icon: "flag", title: "Report batch triaged · 14 items", time: "Oct 28" }
      ],
      payouts: {
        columns: ["Date", "Reference", "Recipient", "Amount"],
        rows: [
          { cells: ["Nov 12", "PAY-9041", "Freelancer batch · 118 contracts", "₱707,000"], status: { label: "Sent", tone: "ok" } },
          { cells: ["Nov 5", "PAY-9033", "Freelancer batch · 104 contracts", "₱638,000"], status: { label: "Sent", tone: "ok" } },
          { cells: ["Nov 1", "PAY-9028", "Tax remittance · Q4", "₱412,000"], status: { label: "Sent", tone: "ok" } },
          { cells: ["Oct 29", "PAY-9019", "Refund reserve", "₱150,000"], status: { label: "Held", tone: "warn" } },
          { cells: ["Oct 24", "PAY-9010", "Freelancer batch · 96 contracts", "₱593,000"], status: { label: "Sent", tone: "ok" } }
        ]
      }
    }
  };

  const QUEUE_EXTRA = {
    moderation: [
      { initials: "RW", title: "Resume writing course", meta: ["Service", "1 report", "5h ago"], status: "Review", tone: "warn" },
      { initials: "CP", title: "Crypto payout promises", meta: ["Job", "auto-flagged keyword", "6h ago"], status: "Flagged", tone: "danger" },
      { initials: "MT", title: "Marie Tanaka", meta: ["Profile", "identity check passed", "Yesterday"], status: "Approved", tone: "ok" },
      { initials: "SD", title: "Sound design bundle", meta: ["Service", "cleared by reviewer", "Nov 1"], status: "Approved", tone: "ok" }
    ],
    reports: [
      { initials: "R5", title: "Late delivery · Order #4809", meta: ["Buyer report", "2 days ago"], status: "Triaged", tone: "warn" },
      { initials: "R6", title: "Spam in project briefs", meta: ["Member report", "2 days ago"], status: "Investigating", tone: "info" },
      { initials: "R7", title: "Account takeover attempt", meta: ["Security report", "Nov 1"], status: "Escalated", tone: "danger" }
    ],
    users: [
      { initials: "MT", title: "Marie Tanaka", meta: ["Freelancer", "marie@skillmarket.com"], status: "New", tone: "info" },
      { initials: "JV", title: "Joel Villanueva", meta: ["Hire talent", "joel@skillmarket.com"], status: "Unverified", tone: "warn" },
      { initials: "RK", title: "Rosa Kilanti", meta: ["Freelancer", "rosa@skillmarket.com"], status: "Active", tone: "ok" }
    ]
  };

  /* --- Switch lists (settings + security) ------------------------------- */

  const storageKey = (name) => `skillmarket.${name}.${role()}`;

  function readFlags(name, defaults) {
    let saved = {};
    try {
      saved = JSON.parse(window.localStorage.getItem(storageKey(name)) || "{}") || {};
    } catch (error) {
      saved = {};
    }
    return defaults.map((item) => ({
      ...item,
      on: typeof saved[item.key] === "boolean" ? saved[item.key] : item.on
    }));
  }

  function writeFlags(name, flags) {
    const data = {};
    flags.forEach((flag) => {
      data[flag.key] = flag.on;
    });
    try {
      window.localStorage.setItem(storageKey(name), JSON.stringify(data));
    } catch (error) {
      /* storage unavailable, the switches still work for this visit */
    }
  }

  const switchRows = (flags, group) =>
    flags
      .map(
        (flag) => `
        <div class="switch-row">
          <span class="switch-row__text">
            <span class="switch-row__label">${esc(flag.label)}</span>
            ${flag.hint ? `<span class="switch-row__hint">${esc(flag.hint)}</span>` : ""}
          </span>
          <button class="switch" type="button" role="switch" aria-checked="${flag.on}"
                  data-mact="${group}-toggle" data-key="${esc(flag.key)}"
                  aria-label="${esc(flag.label)}"><span class="switch__knob"></span></button>
        </div>`
      )
      .join("");

  function switchDialog(options) {
    const flags = readFlags(options.name, options.flags);

    openModal({
      eyebrow: options.eyebrow,
      title: options.title,
      html: `<p class="modal__lead">${esc(options.lead)}</p>
             <div class="switch-list">${switchRows(flags, options.name)}</div>`,
      foot: `<button class="btn btn--secondary" type="button" data-modal-close>Cancel</button>
             <button class="btn btn--primary" type="button" data-mact="${options.name}-save">Save changes</button>`,
      handlers: {
        [`${options.name}-toggle`]: (btn) => {
          const on = btn.getAttribute("aria-checked") !== "true";
          btn.setAttribute("aria-checked", String(on));
          const flag = flags.find((item) => item.key === btn.dataset.key);
          if (flag) flag.on = on;
        },
        [`${options.name}-save`]: () => {
          writeFlags(options.name, flags);
          closeModal();
          toast(options.saved, options.title);
        }
      }
    });
  }

  function openSettings() {
    switchDialog({
      name: "settings",
      eyebrow: "Account",
      title: "Settings",
      lead: "Choose what SkillMarket sends you. Changes apply to this account only.",
      flags: SETTINGS[role()] || SETTINGS.freelancer,
      saved: "Your notification preferences were saved."
    });
  }

  function openSecurity() {
    switchDialog({
      name: "security",
      eyebrow: "Admin",
      title: "Security settings",
      lead: "Guardrails for the super admin account. Every change is written to the audit log.",
      flags: SECURITY,
      saved: "Security settings were updated and logged."
    });
  }

  /**
   * The dedicated settings.html page renders the same per-role switch
   * list as the settings dialog, inline and persisted to the same storage
   * key (`skillmarket.settings.<role>`), so preferences stay in sync no
   * matter which entry point toggles them.
   */
  function hydrateSettingsSwitches() {
    const block = $(`[data-setting-block="${role()}"]`);
    if (!block) return;

    const defaults = SETTINGS[role()] || SETTINGS.freelancer;

    readFlags("settings", defaults).forEach((flag) => {
      const btn = block.querySelector(`[data-setting-key="${flag.key}"]`);
      if (btn) btn.setAttribute("aria-checked", String(flag.on));
    });

    block.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-setting-key]");
      if (!btn || !block.contains(btn)) return;

      const key = btn.dataset.settingKey;
      const on = btn.getAttribute("aria-checked") !== "true";
      btn.setAttribute("aria-checked", String(on));

      const next = readFlags("settings", defaults).map((flag) =>
        flag.key === key ? { ...flag, on } : flag
      );
      writeFlags("settings", next);
      toast("Your notification preferences were saved.", "Settings");
    });
  }

  function openHelp() {
    const items = HELP[role()] || HELP.freelancer;

    openModal({
      eyebrow: "Support",
      title: "Help center",
      html: `<p class="modal__lead">Quick answers for your account. Still stuck? We reply within one business day.</p>
             <div class="faq">
               ${items
                 .map(
                   ([question, answer]) =>
                     `<details class="faq__item"><summary>${esc(question)}</summary><p>${esc(
                       answer
                     )}</p></details>`
                 )
                 .join("")}
             </div>`,
      foot: closeFoot(
        `<button class="btn btn--primary" type="button" data-mact="help-contact">Contact support</button>`
      ),
      handlers: {
        "help-contact": () => {
          closeModal();
          toast(
            `Ticket #${ref()} was opened. We'll reply to ${account().email || "your inbox"}.`,
            "We're on it"
          );
        }
      }
    });
  }

  /* --- Notification + account dropdowns --------------------------------- */

  let openDrop = null;

  function closeDrop() {
    if (!openDrop) return;
    openDrop.el.remove();
    if (openDrop.trigger) openDrop.trigger.setAttribute("aria-expanded", "false");
    openDrop = null;
  }

  function toggleDrop(trigger, html, onMount) {
    const reopening = openDrop && openDrop.trigger === trigger;
    closeDrop();
    if (reopening) return;

    const el = document.createElement("div");
    el.className = "drop";
    el.setAttribute("role", "menu");
    el.innerHTML = html;
    (trigger.closest(".dash__top-actions") || document.body).appendChild(el);

    openDrop = { el, trigger };
    trigger.setAttribute("aria-expanded", "true");
    if (typeof onMount === "function") onMount(el);

    const first = $("button, a[href]", el);
    if (first) first.focus();
  }

  function notificationsHtml() {
    const items = NOTICES[role()] || NOTICES.freelancer;

    return `
      <div class="drop__head">
        <span class="drop__title">Notifications</span>
        <span class="drop__count" data-notice-count>${items.length} new</span>
      </div>
      <ul class="drop__list">
        ${items
          .map(
            (item, index) => `
            <li>
              <button class="drop__item" type="button" role="menuitem" data-notice-index="${index}">
                <span class="drop__icon" aria-hidden="true">${Icons.svg(item.icon)}</span>
                <span class="drop__text">
                  <span class="drop__item-title">${esc(item.title)}</span>
                  <span class="drop__item-sub">${esc(item.text)}</span>
                  <span class="drop__time">${esc(item.time)}</span>
                </span>
              </button>
            </li>`
          )
          .join("")}
      </ul>
      <div class="drop__foot">
        <button class="btn btn--secondary btn--sm" type="button" data-notice-clear>Mark all as read</button>
      </div>`;
  }

  function accountHtml() {
    const user = account();

    return `
      <div class="drop__head drop__head--id">
        <span class="user-chip__avatar" aria-hidden="true">
          <span class="user-chip__initials">${esc(initials(user.name))}</span>
        </span>
        <span class="drop__id">
          <span class="drop__item-title">${esc(user.name)}</span>
          <span class="drop__item-sub">${esc(user.email)}</span>
        </span>
      </div>
      <ul class="drop__list">
        <li><button class="drop__item drop__item--plain" type="button" role="menuitem" data-account="profile">${Icons.svg("user")}<span>My profile</span></button></li>
        <li><button class="drop__item drop__item--plain" type="button" role="menuitem" data-account="settings">${Icons.svg("settings")}<span>Settings</span></button></li>
        <li><button class="drop__item drop__item--plain" type="button" role="menuitem" data-account="help">${Icons.svg("help")}<span>Help center</span></button></li>
      </ul>
      <div class="drop__foot">
        <button class="btn btn--danger btn--sm" type="button" data-account="logout">${Icons.svg("log-out")}<span>Log out</span></button>
      </div>`;
  }

  function toggleNotifications(trigger) {
    toggleDrop(trigger, notificationsHtml(), (el) => {
      el.addEventListener("click", (event) => {
        const item = event.target.closest("[data-notice-index]");
        if (item) {
          const notices = NOTICES[role()] || NOTICES.freelancer;
          const notice = notices[Number(item.dataset.noticeIndex)];
          closeDrop();
          if (notice) {
            // Notice targets live on the shared menu page; scroll when we
            // are already there, otherwise navigate to the section.
            // Notice targets are the dedicated pages (optionally with a
            // same-page hash); scroll when the section is here, else navigate.
            const hash = notice.href.indexOf("#");
            const id = hash === -1 ? null : notice.href.slice(hash + 1);
            if (!id || !scrollToSection(id)) window.location.href = notice.href;
          }
          return;
        }

        if (event.target.closest("[data-notice-clear]")) {
          const dot = $(".icon-btn__dot");
          if (dot) dot.remove();
          const count = $("[data-notice-count]", el);
          if (count) count.textContent = "All caught up";
          $$(".drop__item", el).forEach((row) => row.classList.remove("is-unread"));
          toast("You're all caught up.", "Notifications cleared");
        }
      });
    });
  }

  function toggleAccount(trigger) {
    toggleDrop(trigger, accountHtml(), (el) => {
      el.addEventListener("click", (event) => {
        const item = event.target.closest("[data-account]");
        if (!item) return;
        const key = item.dataset.account;
        closeDrop();

        if (key === "profile") {
          // Profile lives on the dedicated profile.html page now.
          if (!scrollToSection("profile")) window.location.href = "profile.html";
        }
        if (key === "settings") {
          if (!scrollToSection("settings")) window.location.href = "settings.html";
        }
        if (key === "help") openHelp();
        if (key === "logout") confirmLogout();
      });
    });
  }

  function confirmLogout() {
    openModal({
      eyebrow: "Account",
      title: "Log out of SkillMarket?",
      html: `<p class="modal__lead">You'll need to sign in again to reach this dashboard. Your session on this device will be cleared.</p>`,
      foot: `<button class="btn btn--secondary" type="button" data-modal-close>Stay signed in</button>
             <button class="btn btn--danger" type="button" data-mact="logout-yes">Log out</button>`,
      handlers: {
        "logout-yes": () => {
          Session.clear();
          window.location.href = "index.html";
        }
      }
    });
  }

  /* --- List dialogs ----------------------------------------------------- */

  function allProjects() {
    const extras = (EXTRA[role()] && EXTRA[role()].projects) || [];
    const extraHtml = extras
      .map(
        (item) => `
        <li class="list__item list__item--top">
          <div class="list__main">
            <p class="list__title">${esc(item.title)}</p>
            <p class="list__meta"><span>${esc(item.client)}</span><span aria-hidden="true">·</span><span>${esc(
              item.due
            )}</span></p>
            <div class="list__progress">
              <span class="progress"><span class="progress__bar" style="width:${item.pct}%"></span></span>
              <span class="list__percent">${item.pct}%</span>
            </div>
          </div>
          <div class="list__aside"><span class="status status--${item.tone}">${esc(item.status)}</span></div>
        </li>`
      )
      .join("");

    const rows = $$("#projects .list__item").map(stripRow).join("") + extraHtml;

    openModal({
      eyebrow: "Contracts",
      title: "All projects",
      html: `<ul class="panel__body panel__body--flush modal-list">${rows}</ul>
             <p class="modal__note">Every engagement on this account: running, paused and finished.</p>`,
      foot:
        role() === "hire-talent"
          ? closeFoot(
              `<button class="btn btn--primary" type="button" data-mact="go-post-job">Post a job</button>`
            )
          : closeFoot(
              `<button class="btn btn--primary" type="button" data-mact="go-find-work">Find work</button>`
            ),
      handlers:
        role() === "hire-talent"
          ? { "go-post-job": () => postJob() }
          : { "go-find-work": () => { closeModal(); window.location.href = "index.html#jobs"; } }
    });
  }

  function allActivity() {
    const items = $$("#activity .timeline__item").map((item) => item.outerHTML).join("");
    const extras = ((EXTRA[role()] || {}).activity) || [];
    const extraHtml = extras
      .map(
        (item) => `
        <li class="timeline__item">
          <span class="timeline__icon" aria-hidden="true">${Icons.svg(item.icon)}</span>
          <div>
            <p class="timeline__title">${esc(item.title)}</p>
            <p class="timeline__time">${esc(item.time)}</p>
          </div>
        </li>`
      )
      .join("");

    openModal({
      eyebrow: "History",
      title: "Everything that happened",
      html: `<ul class="timeline modal-timeline">${items}${extraHtml}</ul>
             <p class="modal__note">Showing the last 30 days. Older entries stay in the audit log.</p>`,
      foot: closeFoot()
    });
  }

  function tableModal(eyebrow, title, table, note) {
    openModal({
      eyebrow,
      title,
      html: `<div class="table-wrap">
               <table class="data-table">
                 <thead><tr>${table.columns.map((col) => `<th>${esc(col)}</th>`).join("")}<th>Status</th></tr></thead>
                 <tbody>
                   ${table.rows
                     .map(
                       (row) => `<tr>${row.cells
                         .map((cell) => `<td>${esc(cell)}</td>`)
                         .join("")}<td><span class="status status--${
                         row.status.tone
                       }">${esc(row.status.label)}</span></td></tr>`
                     )
                     .join("")}
                 </tbody>
               </table>
             </div>
             <p class="modal__note">${esc(note)}</p>`,
      foot: closeFoot()
    });
  }

  function profilePreview() {
    const user = account();
    const config = PREVIEW[role()] || PREVIEW.freelancer;

    openModal({
      eyebrow: config.eyebrow,
      title: "How others see you",
      html: `<div class="preview">
          <div class="preview__head">
            <span class="avatar avatar--lg" aria-hidden="true">${esc(initials(user.name))}</span>
            <div class="preview__id">
              <p class="preview__name">${esc(user.name)}</p>
              <p class="preview__role">${esc(config.roleLine)}</p>
              <p class="rating preview__rating">${Icons.svg("star")}4.9<span> · 38 reviews</span></p>
            </div>
          </div>
          <p class="preview__bio">${esc(config.bio)}</p>
          <ul class="preview__tags">${config.tags
            .map((tag) => `<li class="tag">${esc(tag)}</li>`)
            .join("")}</ul>
          <dl class="preview__stats">
            ${config.stats
              .map(
                ([term, value]) => `<div><dt>${esc(term)}</dt><dd>${esc(value)}</dd></div>`
              )
              .join("")}
          </dl>
        </div>`,
      foot: closeFoot(
        `<button class="btn btn--primary" type="button" data-mact="copy-link">Copy profile link</button>`
      ),
      handlers: {
        "copy-link": () => {
          const url = `${window.location.href.split("/").pop().split("?")[0]} → ${config.link}`;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(config.link).catch(() => {});
          }
          toast(`Copied: ${url}`, "Link copied");
        }
      }
    });
  }

  /* --- Profile strength steps ------------------------------------------- */

  function addSkills() {
    const added = [];
    const chips = () =>
      added.length
        ? `<ul class="chip-list">${added
            .map(
              (skill, index) => `<li class="chip chip--static">${esc(skill)}
                <button class="chip__x" type="button" data-mact="skill-remove" data-i="${index}"
                        aria-label="Remove ${esc(skill)}">${Icons.svg("close")}</button></li>`
            )
            .join("")}</ul>`
        : `<p class="modal__note">No skills added yet. Type one above and press Add.</p>`;

    const rebuild = (root) => {
      const list = $("[data-skill-list]", root);
      if (list) list.innerHTML = chips();
    };

    const add = (root) => {
      const input = $("#skill-input", root);
      const value = input ? input.value.trim() : "";
      if (!value) {
        fieldError(root, "Type a skill first.");
        return;
      }
      if (added.some((skill) => skill.toLowerCase() === value.toLowerCase())) {
        fieldError(root, "That skill is already on your list.");
        return;
      }
      fieldError(root, "");
      added.push(value);
      if (input) input.value = "";
      rebuild(root);
      if (input) input.focus();
    };

    openModal({
      eyebrow: "Profile strength",
      title: "Add skills",
      html: `<p class="modal__lead">Skills decide which jobs reach you. Save two or more and your profile strength climbs.</p>
             <form class="field-row" data-skill-form novalidate>
               <label class="sr-only" for="skill-input">Skill</label>
               <input class="field__input" id="skill-input" type="text" placeholder="e.g. GraphQL"
                      autocomplete="off" data-autofocus />
               <button class="btn btn--secondary" type="button" data-mact="skill-add">Add</button>
             </form>
             <p class="field__error" data-field-error hidden></p>
             <div data-skill-list>${chips()}</div>`,
      foot: closeFoot(
        `<button class="btn btn--primary" type="button" data-mact="skill-save">Save skills</button>`
      ),
      handlers: {
        "skill-add": (btn, root) => add(root),
        "skill-remove": (btn, root) => {
          added.splice(Number(btn.dataset.i), 1);
          rebuild(root);
        },
        "skill-save": (btn, root) => {
          if (!added.length) {
            fieldError(root, "Add at least one skill before saving.");
            return;
          }

          const todo = $("#profile .checklist__item--todo");
          if (todo) {
            todo.classList.remove("checklist__item--todo");
            todo.innerHTML = `<span class="checklist__mark" aria-hidden="true">${CHECK}</span>Skills added: ${esc(
              added.join(", ")
            )}`;
          }

          const meter = $("#profile .meter__value");
          const bar = $("#profile .meter .progress__bar");
          const subtitle = $("#profile .panel__subtitle");
          const current = meter ? number(meter.textContent) : 85;
          const next = Math.min(100, current + added.length * 3);

          if (meter) meter.textContent = `${next}%`;
          if (bar) bar.style.width = `${next}%`;
          if (subtitle) subtitle.textContent = subtitle.textContent.replace(/^\d+%/, `${next}%`);

          closeModal();
          addActivity(`Profile updated · ${added.length} skill${added.length > 1 ? "s" : ""} added`, "user");
          toast(`${added.join(", ")} now appear on your profile. Strength is ${next}%.`, "Skills added");
        }
      },
      onOpen: (root) => {
        const form = $("[data-skill-form]", root);
        if (!form) return;
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          add(root);
        });
        form.addEventListener("input", () => fieldError(root, ""));
      }
    });
  }

  function finishSetup() {
    const render = (root) => {
      const todos = $$("#profile .checklist__item--todo");
      const body = $("[data-modal-body]", root);

      if (!todos.length) {
        if (body) {
          body.innerHTML = `<div class="success">
            <span class="success__mark" aria-hidden="true">${CHECK}</span>
            <p class="success__title">Company profile complete</p>
            <p class="success__text">Every setup step is done. Complete profiles get about 3× more applications.</p>
          </div>`;
        }
        const foot = $("[data-modal-foot]", root);
        if (foot) {
          foot.innerHTML = `<button class="btn btn--primary" type="button" data-modal-close>Done</button>`;
          foot.hidden = false;
        }
        return;
      }

      if (body) {
        body.innerHTML = `<p class="modal__lead">Two steps left on your company profile. Complete them here and the checklist updates straight away.</p>
          <ul class="step-list">
            ${todos
              .map(
                (item, index) => `<li class="step-list__item">
                  <span>${esc(item.textContent.trim())}</span>
                  <button class="btn btn--secondary btn--sm" type="button" data-mact="setup-step" data-i="${index}">Complete</button>
                </li>`
              )
              .join("")}
          </ul>`;
      }
    };

    openModal({
      eyebrow: "Profile strength",
      title: "Finish setup",
      html: "",
      foot: closeFoot(),
      handlers: {
        "setup-step": (btn, root) => {
          const todos = $$("#profile .checklist__item--todo");
          const item = todos[Number(btn.dataset.i)];
          if (!item) return;

          item.classList.remove("checklist__item--todo");
          item.innerHTML = `<span class="checklist__mark" aria-hidden="true">${CHECK}</span>${esc(
            item.textContent.trim()
          )}`;

          const meter = $("#profile .meter__value");
          const bar = $("#profile .meter .progress__bar");
          const subtitle = $("#profile .panel__subtitle");
          const current = meter ? number(meter.textContent) : 70;
          const next = Math.min(100, current + 5);

          if (meter) meter.textContent = `${next}%`;
          if (bar) bar.style.width = `${next}%`;
          if (subtitle) subtitle.textContent = subtitle.textContent.replace(/^\d+%/, `${next}%`);

          render(root);
          toast(`Profile strength is now ${next}%.`, "Step complete");
        }
      },
      onOpen: (root) => render(root)
    });
  }

  /* --- Inbox ------------------------------------------------------------ */

  function conversations() {
    return $$("#messages .list__item").map((row) => ({
      name: ($(".list__title", row) || {}).textContent || "",
      preview: ($(".list__sub", row) || {}).textContent || "",
      time: ($(".list__time", row) || {}).textContent || "",
      avatar: ($(".avatar", row) || {}).innerHTML || "",
      unread: Boolean($(".list__unread", row)),
      row
    }));
  }

  const msgHtml = (msg) => `
    <div class="msg msg--${msg.who}">
      <p class="msg__text">${esc(msg.text)}</p>
      <span class="msg__time">${esc(msg.time)}</span>
    </div>`;

  function openInbox(focusName) {
    const list = conversations();

    if (!list.length) {
      openModal({
        eyebrow: "Messages",
        title: "Inbox",
        html: `<p class="modal__lead">No conversations yet. When a client or contractor writes, the thread lands here.</p>`,
        foot: closeFoot()
      });
      return;
    }

    const target = focusName
      ? list.find((item) => item.name.trim() === String(focusName).trim())
      : null;

    if (target) showThread(target, list);
    else showConversationList(list);
  }

  function showConversationList(list) {
    openModal({
      eyebrow: "Messages",
      title: "Inbox",
      html: `<ul class="conv">
          ${list
            .map(
              (item, index) => `<li>
                <button class="conv__item${item.unread ? " is-unread" : ""}" type="button" data-mact="conv" data-i="${index}">
                  <span class="avatar" aria-hidden="true">${item.avatar}</span>
                  <span class="conv__text">
                    <span class="conv__top">
                      <span class="conv__name">${esc(item.name)}</span>
                      <span class="conv__time">${esc(item.time)}</span>
                    </span>
                    <span class="conv__preview">${esc(item.preview)}</span>
                  </span>
                  ${item.unread ? `<span class="list__unread" aria-label="Unread"></span>` : ""}
                </button>
              </li>`
            )
            .join("")}
        </ul>`,
      foot: closeFoot(
        `<button class="btn btn--primary" type="button" data-mact="compose">New message</button>`
      ),
      handlers: {
        conv: (btn, root) => showThread(list[Number(btn.dataset.i)], list),
        compose: () => composeMessage(list)
      }
    });
  }

  function showThread(item, list) {
    const history = [
      { who: "them", text: item.preview, time: item.time || "Earlier" },
      { who: "me", text: "Thanks. I've seen it and will get back to you today.", time: "Earlier" }
    ];

    openModal({
      eyebrow: "Conversation",
      title: item.name,
      html: `<div class="thread">
          <div class="thread__head">
            <span class="avatar" aria-hidden="true">${item.avatar}</span>
            <span class="thread__id">
              <span class="thread__name">${esc(item.name)}</span>
              <span class="thread__status">Usually replies within an hour</span>
            </span>
          </div>
          <div class="thread__msgs" data-thread-msgs>${history.map(msgHtml).join("")}</div>
        </div>`,
      foot: `<form class="composer" data-composer novalidate>
          <label class="sr-only" for="thread-input">Message ${esc(item.name)}</label>
          <input class="field__input" id="thread-input" type="text" placeholder="Write a reply…"
                 autocomplete="off" data-autofocus />
          <button class="btn btn--primary" type="button" data-mact="send">Send</button>
        </form>
        <p class="field__error" data-field-error hidden></p>`,
      handlers: {
        send: (btn, root) => sendThread(item, root)
      },
      onOpen: (root) => bindComposer(root, item, list, true)
    });
  }

  function bindComposer(root, item, list, isThread) {
    const form = $("[data-composer]", root);
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (isThread) sendThread(item, root);
      else sendComposed(root, list);
    });

    const input = $(".field__input", form);
    if (input) input.addEventListener("input", () => fieldError(root, ""));
  }

  function sendThread(item, root) {
    const input = $("#thread-input", root);
    const text = input ? input.value.trim() : "";
    if (!text) {
      fieldError(root, "Type a message first.");
      if (input) input.focus();
      return;
    }

    const messages = $("[data-thread-msgs]", root);
    if (messages) {
      messages.insertAdjacentHTML("beforeend", msgHtml({ who: "me", text, time: "Just now" }));
      messages.scrollTop = messages.scrollHeight;
    }
    if (input) input.value = "";
    fieldError(root, "");

    if (item.row) {
      const preview = $(".list__sub", item.row);
      const time = $(".list__time", item.row);
      const unread = $(".list__unread", item.row);
      if (preview) preview.textContent = text;
      if (time) time.textContent = "now";
      if (unread) unread.remove();
    }

    toast(`Your reply to ${item.name} was sent.`, "Message sent");
    if (input) input.focus();
  }

  function composeMessage(list) {
    openModal({
      eyebrow: "Messages",
      title: "New message",
      html: `<p class="modal__lead">Pick a conversation and write the first line.</p>
             <form class="form" data-composer novalidate>
               <p class="field">
                 <label class="field__label" for="compose-to">To</label>
                 <select class="field__input" id="compose-to" name="to">
                   ${list.map((item) => `<option value="${esc(item.name)}">${esc(item.name)}</option>`).join("")}
                 </select>
               </p>
               <p class="field">
                 <label class="field__label" for="compose-text">Message</label>
                 <textarea class="field__input" id="compose-text" name="text" rows="4"
                           placeholder="Hi, quick update from SkillMarket…"></textarea>
               </p>
               <p class="field__error" data-field-error hidden></p>
             </form>`,
      foot: `<button class="btn btn--secondary" type="button" data-modal-close>Cancel</button>
             <button class="btn btn--primary" type="button" data-mact="send">Send message</button>`,
      handlers: {
        send: (btn, root) => sendComposed(root, list)
      },
      onOpen: (root) => bindComposer(root, null, list)
    });
  }

  function sendComposed(root, list) {
    const to = $("#compose-to", root);
    const text = $("#compose-text", root);
    const value = text ? text.value.trim() : "";
    const name = to ? to.value : "";

    if (!value) {
      fieldError(root, "Write a message before sending.");
      if (text) text.focus();
      return;
    }

    const target = list.find((item) => item.name === name);
    if (target && target.row) {
      const preview = $(".list__sub", target.row);
      const time = $(".list__time", target.row);
      const unread = $(".list__unread", target.row);
      if (preview) preview.textContent = value;
      if (time) time.textContent = "now";
      if (unread) unread.remove();
    }

    closeModal();
    toast(`Your message to ${name} was sent.`, "Message sent");
  }

  /* --- Form dialogs ----------------------------------------------------- */

  function formModal(options) {
    const controls = options.fields
      .map((field) => {
        const id = `field-${field.name}`;
        let control;

        if (field.type === "select") {
          control = `<select class="field__input" id="${id}" name="${field.name}">
            ${field.options
              .map(
                (option) =>
                  `<option value="${esc(option)}"${option === field.value ? " selected" : ""}>${esc(
                    option
                  )}</option>`
              )
              .join("")}
          </select>`;
        } else if (field.type === "textarea") {
          control = `<textarea class="field__input" id="${id}" name="${field.name}" rows="3"
                     placeholder="${esc(field.placeholder || "")}">${esc(field.value || "")}</textarea>`;
        } else {
          control = `<input class="field__input" id="${id}" name="${field.name}" type="${
            field.type || "text"
          }" placeholder="${esc(field.placeholder || "")}" value="${esc(field.value || "")}"
                     autocomplete="off" />`;
        }

        return `<p class="field">
          <label class="field__label" for="${id}">${esc(field.label)}</label>
          ${control}
          ${field.hint ? `<span class="field__hint">${esc(field.hint)}</span>` : ""}
        </p>`;
      })
      .join("");

    const submit = (root) => {
      const form = $("[data-modal-form]", root);
      if (!form) return;

      const values = {};
      options.fields.forEach((field) => {
        const control = form.elements[field.name];
        values[field.name] = control ? String(control.value || "").trim() : "";
      });

      const missing = options.fields.filter((field) => field.required && !values[field.name]);
      if (missing.length) {
        fieldError(root, `Please fill in ${missing.map((field) => field.label.toLowerCase()).join(", ")}.`);
        const control = form.elements[missing[0].name];
        if (control) control.focus();
        return;
      }

      const emailField = options.fields.find((field) => field.type === "email");
      if (emailField && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values[emailField.name])) {
        fieldError(root, "Enter a valid email address.");
        const control = form.elements[emailField.name];
        if (control) control.focus();
        return;
      }

      options.onSubmit(values, root);
    };

    openModal({
      eyebrow: options.eyebrow,
      title: options.title,
      html: `${options.lead ? `<p class="modal__lead">${esc(options.lead)}</p>` : ""}
             <form class="form" data-modal-form novalidate>${controls}
               <p class="field__error" data-field-error hidden></p>
             </form>`,
      foot: `<button class="btn btn--secondary" type="button" data-modal-close>Cancel</button>
             <button class="btn btn--primary" type="button" data-mact="form-submit">${esc(
               options.submitLabel
             )}</button>`,
      handlers: { "form-submit": (btn, root) => submit(root) },
      onOpen: (root) => {
        const form = $("[data-modal-form]", root);
        if (!form) return;
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          submit(root);
        });
        form.addEventListener("input", () => fieldError(root, ""));
        form.addEventListener("change", () => fieldError(root, ""));
      }
    });
  }

  function withdraw() {
    const foot = $("#payments .panel__foot-value");
    const pending = foot ? number(foot.textContent) : 0;

    formModal({
      eyebrow: "Earnings",
      title: "Withdraw balance",
      lead: `${peso(pending)} is available now. Transfers are reviewed within 1–2 business days.`,
      fields: [
        {
          name: "amount",
          label: "Amount (₱)",
          type: "text",
          placeholder: String(pending),
          value: String(pending),
          required: true,
          hint: `Between ₱1 and ${peso(pending)}`
        },
        {
          name: "method",
          label: "Send to",
          type: "select",
          options: ["GCash ·•••• 4821", "Bank transfer ·•••• 9017", "PayPal · sabriel@wallet.com"]
        }
      ],
      submitLabel: "Withdraw",
      onSubmit: (values, root) => {
        const amount = number(values.amount);
        if (!amount || amount > pending) {
          fieldError(root, `Enter an amount between ₱1 and ${peso(pending)}.`);
          return;
        }

        if (foot) foot.textContent = peso(pending - amount);
        addActivity(`Withdrawal requested · ${peso(amount)} to ${String(values.method).split("·")[0].trim()}`, "wallet");

        successModal({
          eyebrow: "Earnings",
          title: "Withdrawal requested",
          heading: `${peso(amount)} is on its way`,
          text: `Reference <strong>WD-${ref()}</strong> to ${esc(values.method)}. You'll get an email the moment it clears.`
        });
        toast(`We're reviewing your ${peso(amount)} transfer now.`, "Withdrawal requested");
      }
    });
  }

  function addFunds() {
    const foot = $("#payments .panel__foot-value");
    const escrow = foot ? number(foot.textContent) : 0;

    formModal({
      eyebrow: "Billing",
      title: "Add funds to escrow",
      lead: "Escrow protects both sides: contractors are paid the moment you approve a milestone.",
      fields: [
        {
          name: "amount",
          label: "Amount (₱)",
          type: "text",
          placeholder: "50000",
          value: "50000",
          required: true,
          hint: "Funds stay yours until a milestone is approved"
        },
        {
          name: "method",
          label: "Pay with",
          type: "select",
          options: ["Company card ·•••• 2210", "Bank transfer", "PayPal · billing@studio.com"]
        }
      ],
      submitLabel: "Add funds",
      onSubmit: (values, root) => {
        const amount = number(values.amount);
        if (!amount || amount < 1000) {
          fieldError(root, "Enter at least ₱1,000.");
          return;
        }

        if (foot) foot.textContent = peso(escrow + amount);
        addActivity(`Escrow funded · ${peso(amount)} added`, "wallet");

        successModal({
          eyebrow: "Billing",
          title: "Funds added",
          heading: `${peso(amount)} added to escrow`,
          text: `Charged to ${esc(values.method)}. Reference <strong>ESC-${ref()}</strong>.`
        });
        toast(`${peso(amount)} is ready to allocate to milestones.`, "Escrow funded");
      }
    });
  }

  function postJob() {
    formModal({
      eyebrow: "Hiring",
      title: "Post a job",
      lead: "Clear scope, real budget and 3–5 skills. That brief gets about twice the applications.",
      fields: [
        { name: "title", label: "Job title", type: "text", placeholder: "Senior React Developer", required: true },
        { name: "budget", label: "Budget (₱)", type: "text", placeholder: "120000", required: true, hint: "Total for the milestone" },
        { name: "brief", label: "Brief", type: "textarea", placeholder: "What needs building, and by when?", required: true }
      ],
      submitLabel: "Publish job",
      onSubmit: (values, root) => {
        changeStat("Open jobs", 1);
        addActivity(`Job posted · ${values.title}`, "file-text");

        successModal({
          eyebrow: "Hiring",
          title: "Job published",
          heading: "Your job is live",
          text: `<strong>${esc(values.title)}</strong> at ${esc(peso(number(values.budget)))} is now visible to every freelancer on SkillMarket.`
        });
        toast("Applications usually start within a few hours.", "Job published");
      }
    });
  }

  function inviteAdmin() {
    formModal({
      eyebrow: "Team",
      title: "Invite an admin",
      lead: "Invitations expire after 48 hours and every action they take is logged.",
      fields: [
        { name: "email", label: "Email address", type: "email", placeholder: "moderator@skillmarket.com", required: true },
        {
          name: "level",
          label: "Access level",
          type: "select",
          options: ["Moderator · queues and reports", "Support · tickets and refunds", "Super admin · full access"]
        },
        { name: "note", label: "Note (optional)", type: "textarea", placeholder: "Why they're joining…" }
      ],
      submitLabel: "Send invitation",
      onSubmit: (values, root) => {
        addActivity(`Admin invited · ${values.email}`, "users");

        successModal({
          eyebrow: "Team",
          title: "Invitation sent",
          heading: "Invitation on its way",
          text: `<strong>${esc(values.email)}</strong> was invited as ${esc(
            String(values.level).split("·")[0].trim().toLowerCase()
          )}. Reference <strong>INV-${ref()}</strong>.`
        });
        toast(`We emailed ${values.email} a sign-in link.`, "Invitation sent");
      }
    });
  }

  function exportReport() {
    const rows = [["Month", "Revenue (PHP)"]];
    $$("#revenue .chart__col").forEach((col) => {
      const label = ($(".chart__label", col) || {}).textContent || "";
      const bar = $(".chart__bar", col);
      rows.push([label.trim(), String(number(bar ? bar.getAttribute("title") : ""))]);
    });
    rows.push([]);
    rows.push(["Metric", "Value"]);
    $$(".stats .stat").forEach((stat) => {
      rows.push([
        (($(".stat__label", stat) || {}).textContent || "").trim(),
        (($(".stat__value", stat) || {}).textContent || "").trim()
      ]);
    });

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    try {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `skillmarket-revenue-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast("Six months of revenue and every headline metric were saved as CSV.", "Report exported");
    } catch (error) {
      toast("The browser blocked the download. Try serving the folder over HTTP.", "Export failed");
    }
  }

  /* --- Queue dialogs (moderation, reports, users) ----------------------- */

  function queueModal(options) {
    const source = $$(options.panel + " .list__item");
    const bodies = source.map(stripRow).concat(options.extras.map(listRow));
    let modalRows = [];

    function apply(index, action, silent) {
      const row = modalRows[index];
      if (!row || !$(".row-actions", row)) return;

      setStatus(row, action.result, action.tone);
      const bar = $(".row-actions", row);
      if (bar) bar.innerHTML = `<span class="row-done">${CHECK}${esc(action.done)}</span>`;

      if (index < source.length) setStatus(source[index], action.result, action.tone);
      if (action.stat) changeStat(action.stat, -1);
      if (!silent) {
        if (action.activity) addActivity(action.activity, action.icon || "shield");
        toast(action.toast, action.done);
      }
    }

    const handlers = {};
    options.actions.forEach((action) => {
      handlers[`q-${action.key}`] = (btn) => apply(Number(btn.dataset.i), action, false);
    });
    handlers["q-all"] = () => {
      let count = 0;
      modalRows.forEach((row, index) => {
        if ($(".row-actions", row)) {
          apply(index, options.actions[0], true);
          count += 1;
        }
      });

      if (count && options.actions[0].activity) {
        addActivity(`${count} ${options.noun} ${options.actions[0].past}`, options.actions[0].icon || "shield");
      }
      toast(
        count ? `${count} ${options.noun} ${options.actions[0].past}.` : "Nothing left in this queue.",
        options.bulkTitle
      );
    };

    openModal({
      eyebrow: options.eyebrow,
      title: options.title,
      html: `<ul class="panel__body panel__body--flush modal-list">${bodies.join("")}</ul>
             <p class="modal__note">${esc(options.note)}</p>`,
      foot: closeFoot(
        `<button class="btn btn--primary" type="button" data-mact="q-all">${esc(
          options.primary
        )}</button>`
      ),
      handlers,
      onOpen: (root) => {
        modalRows = $$(".modal__body .list__item", root);
        modalRows.forEach((row, index) => {
          const main = $(".list__main", row);
          if (!main) return;
          const bar = document.createElement("div");
          bar.className = "row-actions";
          bar.innerHTML = options.actions
            .map(
              (action) =>
                `<button class="btn btn--${action.variant} btn--sm" type="button" data-mact="q-${action.key}" data-i="${index}">${esc(
                  action.label
                )}</button>`
            )
            .join("");
          main.appendChild(bar);
        });
      }
    });
  }

  function openModerationQueue() {
    queueModal({
      eyebrow: "Platform",
      title: "Moderation queue",
      panel: "#moderation",
      extras: QUEUE_EXTRA.moderation,
      note: "Every decision is written to the audit log with your name and the time.",
      primary: "Approve all remaining",
      noun: "items",
      bulkTitle: "Queue cleared",
      actions: [
        {
          key: "approve",
          label: "Approve",
          variant: "primary",
          result: "Approved",
          tone: "ok",
          done: "Approved",
          past: "approved",
          stat: "In moderation queue",
          activity: "Item approved · restored in search",
          icon: "shield",
          toast: "The listing is back in search and the action was logged."
        },
        {
          key: "reject",
          label: "Reject",
          variant: "danger",
          result: "Rejected",
          tone: "danger",
          done: "Rejected",
          past: "rejected",
          stat: "In moderation queue",
          activity: "Item rejected · listing removed",
          icon: "shield",
          toast: "The listing was removed and the owner was notified."
        }
      ]
    });
  }

  function openReports() {
    queueModal({
      eyebrow: "Platform",
      title: "Open reports",
      panel: "#reports",
      extras: QUEUE_EXTRA.reports,
      note: "Resolved reports stay searchable for 90 days under Trust & safety.",
      primary: "Resolve all remaining",
      noun: "reports",
      bulkTitle: "Inbox cleared",
      actions: [
        {
          key: "resolve",
          label: "Resolve",
          variant: "primary",
          result: "Resolved",
          tone: "ok",
          done: "Resolved",
          past: "resolved",
          stat: "Open reports",
          activity: "Report resolved · both parties notified",
          icon: "flag",
          toast: "Both parties were notified and the report was closed."
        },
        {
          key: "escalate",
          label: "Escalate",
          variant: "secondary",
          result: "Escalated",
          tone: "warn",
          done: "Escalated",
          past: "escalated",
          stat: "Open reports",
          activity: "Report escalated to the trust & safety team",
          icon: "flag",
          toast: "The trust & safety team has been paged."
        }
      ]
    });
  }

  function openUsers() {
    queueModal({
      eyebrow: "Platform",
      title: "All users",
      panel: "#users",
      extras: QUEUE_EXTRA.users,
      note: "Showing the most recent sign-ups. Verification unlocks payments for that account.",
      primary: "Verify all remaining",
      noun: "accounts",
      bulkTitle: "Accounts verified",
      actions: [
        {
          key: "verify",
          label: "Verify",
          variant: "primary",
          result: "Active",
          tone: "ok",
          done: "Verified",
          past: "verified",
          activity: "Account verified · payments unlocked",
          icon: "users",
          toast: "The account can now take jobs and post briefs."
        },
        {
          key: "suspend",
          label: "Suspend",
          variant: "danger",
          result: "Suspended",
          tone: "danger",
          done: "Suspended",
          past: "suspended",
          activity: "Account suspended · owner notified",
          icon: "users",
          toast: "The account was suspended and notified."
        }
      ]
    });
  }

  /* --- Row details ------------------------------------------------------ */

  function openRowDetail(row) {
    const panel = row.closest(".panel");
    const id = panel ? panel.id : "";
    const title = (($(".list__title", row) || {}).textContent || "").trim();
    // Row metas are three <span>s with no source whitespace; restore the
    // spaces the CSS gap provides so dialog copy reads naturally.
    const meta = (($(".list__meta", row) || {}).textContent || "")
      .replace(/\s*·\s*/g, " · ")
      .trim();
    const status = (($(".status", row) || {}).textContent || "").trim();
    const percent = (($(".list__percent", row) || {}).textContent || "").trim();
    const config = ROW_DETAIL[id];
    if (!config) return;

    const info = config({ row, title, meta, status, percent });
    const handlers = {};
    let primary = "";

    if (info.action) {
      handlers[info.action.key] = info.action.run;
      primary = `<button class="btn btn--primary" type="button" data-mact="${info.action.key}">${esc(
        info.action.label
      )}</button>`;
    }

    openModal({ eyebrow: info.eyebrow, title, html: info.html, foot: closeFoot(primary), handlers });
  }

  const detailGrid = (pairs) => `
    <div class="detail-grid">
      ${pairs
        .map(([term, value]) => `<div><span>${esc(term)}</span><strong>${esc(value)}</strong></div>`)
        .join("")}
    </div>`;

  const ROW_DETAIL = {
    projects: (info) => ({
      eyebrow: "Project",
      html: `<p class="modal__lead">${esc(info.meta)}</p>
             ${detailGrid([
               ["Status", info.status || "On track"],
               ["Progress", info.percent || "Not set"],
               ["Next milestone", "Client review"],
               ["Invoices", "Up to date"]
             ])}
             <p class="modal__note">Messages, files and invoices for this contract stay in one thread.</p>`,
      action: {
        key: "row-message",
        label: "Message client",
        run: () => {
          closeModal();
          openInbox(String(info.meta).split("·")[0].trim());
        }
      }
    }),

    applications: (info) =>
      role() === "freelancer"
        ? {
            eyebrow: "Proposal",
            html: `<p class="modal__lead">${esc(info.meta)}</p>
                   ${detailGrid([
                     ["Status", info.status || "Sent"],
                     ["Sent", "3 days ago"],
                     ["Client viewed", "Yesterday"],
                     ["Your rate", String(info.meta).split("·").pop().trim()]
                   ])}
                   <p class="modal__note">Withdrawing closes the proposal. You can always send it again while the job is open.</p>`,
            action: {
              key: "row-withdraw",
              label: "Withdraw proposal",
              run: () => {
                setStatus(info.row, "Withdrawn", "muted");
                closeModal();
                addActivity(`Proposal withdrawn · ${info.title}`, "file-text");
                toast(`Your proposal for ${info.title} was withdrawn.`, "Proposal withdrawn");
              }
            }
          }
        : {
            eyebrow: "Candidate",
            html: `<p class="modal__lead">${esc(info.meta)}</p>
                   ${detailGrid([
                     ["Status", info.status || "New"],
                     ["Applied", "2 days ago"],
                     ["Interviews", "1 completed"],
                     ["Availability", "20 hrs/week"]
                   ])}
                   <p class="modal__note">Shortlisted candidates move to the top of this panel and get an email.</p>`,
            action: {
              key: "row-shortlist",
              label: "Shortlist candidate",
              run: () => {
                setStatus(info.row, "Shortlisted", "ok");
                closeModal();
                addActivity(`Shortlisted · ${info.title}`, "users");
                toast(`${info.title} was shortlisted and notified.`, "Shortlisted");
              }
            }
          },

    users: (info) => ({
      eyebrow: "Account",
      html: `<p class="modal__lead">${esc(info.meta)}</p>
             ${detailGrid([
               ["Status", info.status || "New"],
               ["Signed up", "This week"],
               ["Email", "Verified via link"],
               ["Risk score", "Low"]
             ])}
             <p class="modal__note">Verified accounts can take jobs, post briefs and withdraw funds.</p>`,
      action: {
        key: "row-verify",
        label: "Verify account",
        run: () => {
          setStatus(info.row, "Active", "ok");
          closeModal();
          addActivity(`Account verified · ${info.title}`, "users");
          toast(`${info.title} is verified and fully active.`, "Account verified");
        }
      }
    }),

    moderation: (info) => ({
      eyebrow: "Moderation",
      html: `<p class="modal__lead">${esc(info.meta)}</p>
             ${detailGrid([
               ["Status", info.status || "Review"],
               ["Reports", "3 filed"],
               ["Reviewer", "Unassigned"],
               ["Age", "2 hours"]
             ])}
             <p class="modal__note">Approving restores the item in search; rejecting removes it and notifies the owner.</p>`,
      action: {
        key: "row-approve",
        label: "Approve item",
        run: () => {
          setStatus(info.row, "Approved", "ok");
          changeStat("In moderation queue", -1);
          closeModal();
          addActivity(`Item approved · ${info.title}`, "shield");
          toast(`${info.title} was approved and logged.`, "Item approved");
        }
      }
    }),

    reports: (info) => ({
      eyebrow: "Report",
      html: `<p class="modal__lead">${esc(info.meta)}</p>
             ${detailGrid([
               ["Status", info.status || "Open"],
               ["Filed", "1 hour ago"],
               ["Assigned to", "You"],
               ["Priority", info.status === "Urgent" ? "Urgent" : "Normal"]
             ])}
             <p class="modal__note">Resolving closes the report and emails both the reporter and the reported member.</p>`,
      action: {
        key: "row-resolve",
        label: "Resolve report",
        run: () => {
          setStatus(info.row, "Resolved", "ok");
          changeStat("Open reports", -1);
          closeModal();
          addActivity(`Report resolved · ${info.title}`, "flag");
          toast(`${info.title} was resolved.`, "Report resolved");
        }
      }
    })
  };

  /* --- Dedicated page actions ------------------------------------------- */

  // Quick replies on the messages page: copies the canned text (best
  // effort) and confirms, so the button is never a dead click.
  function quickReply(trigger) {
    const text = trigger.dataset.text || "Got it, thanks!";
    try {
      if (window.navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    } catch (error) {
      /* clipboard unavailable (file:// or permissions), the toast still confirms */
    }
    toast(`“${text}”, paste it in the composer and adjust the details.`, "Quick reply");
  }

  function addPayoutMethod() {
    formModal({
      eyebrow: "Payments",
      title: "Add payout method",
      lead: "New methods are verified once, then payouts clear to them automatically.",
      fields: [
        { name: "method", label: "Method", type: "select", options: ["GCash", "BPI", "Metrobank", "PayPal"], value: "GCash", required: true },
        { name: "account", label: "Account number or handle", type: "text", placeholder: "09XX XXX XXXX", required: true, hint: "Double-check this, payouts to a wrong account cannot be reversed" },
        { name: "name", label: "Account name", type: "text", placeholder: "Name on the account", required: true }
      ],
      submitLabel: "Add method",
      onSubmit: () => {
        successModal({
          eyebrow: "Payments",
          title: "Method added",
          heading: "Payout method added",
          text: "We'll send a ₱1 test transfer to verify the account, then it shows up in Settings."
        });
        toast("Your payout method was added and is awaiting verification.", "Payout method added");
      }
    });
  }

  function videoIntro() {
    toast("Record or upload a 60-second intro, profiles with video get 2× more messages.", "Add a video intro");
  }

  function rotateApiKey() {
    toast("A new key was generated and emailed to you. The old key works for 24 more hours.", "API key rotated");
  }

  function preferences() {
    formModal({
      eyebrow: "Account",
      title: "Account preferences",
      lead: "How SkillMarket displays dates, numbers and money for you.",
      fields: [
        { name: "language", label: "Language", type: "select", options: ["English (Philippines)", "English (US)", "Filipino"], value: "English (Philippines)" },
        { name: "timezone", label: "Time zone", type: "select", options: ["(GMT+8) Manila", "(GMT+9) Tokyo", "(GMT+7) Jakarta"], value: "(GMT+8) Manila" },
        { name: "currency", label: "Currency", type: "select", options: ["₱ Philippine peso", "$ US dollar", "€ Euro"], value: "₱ Philippine peso" }
      ],
      submitLabel: "Save preferences",
      onSubmit: () => {
        successModal({
          eyebrow: "Account",
          title: "Preferences",
          heading: "Preferences saved",
          text: "Dates, numbers and money now display the way you chose. Other sessions catch up on next sign-in."
        });
        toast("Your preferences were saved.", "Preferences");
      }
    });
  }

  function signoutOthers() {
    toast("All other sessions were signed out. This device stays signed in.", "Sessions");
  }

  function deactivate() {
    openModal({
      eyebrow: "Account",
      title: "Deactivate your account?",
      html: `<p class="modal__lead">Your profile disappears from search right away. You have 30 days to change your mind, after that your data is permanently removed.</p>`,
      foot: `<button class="btn btn--secondary" type="button" data-modal-close>Keep my account</button>
             <button class="btn btn--danger" type="button" data-mact="deactivate-yes">Deactivate</button>`,
      handlers: {
        "deactivate-yes": () => {
          closeModal();
          toast("We emailed you a confirmation link, your account deactivates only when you click it.", "Check your inbox");
        }
      }
    });
  }

  /* --- Action registry -------------------------------------------------- */

  const ACTIONS = {
    settings: () => openSettings(),
    help: () => openHelp(),
    "security-settings": () => openSecurity(),
    notifications: (trigger) => toggleNotifications(trigger),
    account: (trigger) => toggleAccount(trigger),

    "projects-all": () => allProjects(),
    "activity-all": () => allActivity(),
    inbox: () => openInbox(),
    "profile-preview": () => profilePreview(),
    "add-skills": () => addSkills(),
    "finish-setup": () => finishSetup(),

    "earnings-history": () => {
      const table = (EXTRA.freelancer || {}).history;
      tableModal(
        "Earnings",
        "Transaction history",
        table,
        "November totals ₱275,000, matching the figure on your Earnings card."
      );
    },
    invoices: () => {
      const table = (EXTRA["hire-talent"] || {}).invoices;
      tableModal(
        "Billing",
        "Invoice history",
        table,
        "November spend totals ₱707,000 across every active contract."
      );
    },
    payouts: () => {
      const table = (EXTRA["super-admin"] || {}).payouts;
      tableModal(
        "Platform",
        "Payout history",
        table,
        "Batch payouts run every Wednesday and are reconciled against escrow."
      );
    },

    withdraw: () => withdraw(),
    "add-funds": () => addFunds(),
    "post-job": () => postJob(),
    "invite-admin": () => inviteAdmin(),
    "export-report": () => exportReport(),

    "users-all": () => openUsers(),
    "moderation-queue": () => openModerationQueue(),
    "reports-all": () => openReports(),

    "quick-reply": (trigger) => quickReply(trigger),
    "add-payout-method": () => addPayoutMethod(),
    "video-intro": () => videoIntro(),
    "rotate-api-key": () => rotateApiKey(),
    "preferences": () => preferences(),
    "signout-others": () => signoutOthers(),
    "deactivate": () => deactivate()
  };

  const run = (key, trigger) => {
    const action = ACTIONS[key];
    if (!action) return false;
    action(trigger);
    return true;
  };

  /* --- Wiring ----------------------------------------------------------- */

  function wireActions() {
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-act]");
      if (!trigger) return;
      if (!run(trigger.dataset.act, trigger)) return;
      if (trigger.tagName === "A") event.preventDefault();
    });
  }

  function wireAccountChip() {
    const chip = $(".user-chip");
    if (!chip) return;

    chip.dataset.act = "account";
    chip.setAttribute("role", "button");
    chip.setAttribute("tabindex", "0");
    chip.setAttribute("aria-haspopup", "menu");
    chip.setAttribute("aria-expanded", "false");

    chip.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggleAccount(chip);
    });
  }

  function wireRows() {
    $$(".dash__grid .list__item").forEach((row) => {
      const panel = row.closest(".panel");
      if (!panel) return;

      const open = () => {
        if (panel.id === "messages") {
          openInbox((($(".list__title", row) || {}).textContent || "").trim());
          return;
        }
        openRowDetail(row);
      };

      row.setAttribute("tabindex", "0");
      row.setAttribute("role", "button");
      row.classList.add("is-clickable");

      row.addEventListener("click", open);
      row.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        open();
      });
    });
  }

  function wireDropDismiss() {
    document.addEventListener("click", (event) => {
      if (!openDrop) return;
      if (openDrop.el.contains(event.target) || openDrop.trigger.contains(event.target)) return;
      closeDrop();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && openDrop) closeDrop();
    });
  }

  /** Sidebar links with no matching section (#settings, #help) open a dialog. */
  function openHref(href) {
    if (href === "#settings") {
      run("settings");
      return true;
    }
    if (href === "#help") {
      run("help");
      return true;
    }
    return false;
  }

  /** Escape closes the dialog even when focus sits on the backdrop. */
  function wireModalEscape() {
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const root = $("[data-modal]");
      if (root && !root.hidden) closeModal();
    });
  }

  /** Fallback for any control still carrying a legacy data-notice string. */
  function notice(html) {
    const parts = String(html || "").split(/<br\s*\/?>/i);
    const strip = (value) => value.replace(/<[^>]*>/g, "").trim();
    toast(strip(parts[1]) || "This action is part of the full product.", strip(parts[0]) || "SkillMarket");
  }

  window.DashActions = { openHref, notice, toast, open: run };

  function init() {
    if (!Session.get()) return;
    wireActions();
    wireAccountChip();
    wireRows();
    wireDropDismiss();
    wireModalEscape();
    hydrateSettingsSwitches();
  }

  init();
})();







