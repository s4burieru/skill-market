# SkillMarket

A Fiverr-style marketplace landing page built with **plain HTML, CSS and JavaScript**, no frameworks. All listing content is loaded from JSON files.

---

## Running it

Either open `index.html` directly (double-click it, no server needed), or serve the folder over HTTP:

```bash
npx serve .
# or
npx http-server .
# or use the "Live Server" extension in VS Code
```

Then open the address it prints (e.g. `http://localhost:3000`).

> Served over HTTP, the page fetches the live `data/*.json` files, so JSON edits show up on reload. Opened from disk (`file://`) browsers block `fetch()` of local files, so the page reads the snapshot baked into `js/data-bundle.js`; regenerate it with `npm run build:data` after editing anything in `data/`.

---

## Project structure

```
skill-market/
├── index.html              # Home page markup + page-specific copy
│                           # (future pages sit at root too: about.html, services.html, …)
├── explore.html            # Browse every service: search + category pills
├── freelancers.html        # Find freelancers: search + role chips
├── jobs.html               # Find jobs: search + job-type chips
│                           # The three above share js/pages/browse.js + css/pages/browse.css,
│                           # selected with <body data-browse="services|freelancers|jobs">
├── become-freelancer.html  # "Become a freelancer" page (hero, steps, fees, FAQ)
├── service-details.html    # Service detail + reviews, ?id=svc-001
├── freelancer-details.html # Freelancer profile + reviews, ?id=flw-001
├── job-details.html        # Job brief + apply panel, ?id=job-001
│                           # The three detail pages share css/pages/detail.css
├── freelancer-dashboard.html   # Dashboard for freelancer accounts (overview)
├── hire-talent-dashboard.html  # Dashboard for hire-talent accounts (overview)
├── super-admin-dashboard.html  # Dashboard for super-admin accounts (overview)
│                           # All three share one shell: welcome header, stats,
│                           # then condensed panels (projects/applications,
│                           # milestones/moderation, messages/reports, revenue,
│                           # activity) that link through to the dedicated pages.
├── projects.html           # Dedicated sidebar pages, one per sidebar item, each
├── applications.html       # sharing the shell and picking per-role content at boot
├── messages.html           # ([data-role-block]). Freelancer & hire-talent get
├── payments.html           # projects/applications/messages/payments; every role gets
├── activity.html           # activity, profile and settings; the super admin gets
├── users.html              # users, moderation, reports and revenue instead.
├── moderation.html         # Pages declare their roles on <body data-roles="…"> and
├── reports.html            # bounce other roles to their own dashboard.
├── revenue.html            #
├── profile.html            # Edit profile form, per role, details pre-filled from the account
├── settings.html           # Notification switches, saved as you toggle
├── css/
│   ├── variables.css       # Design tokens (colors, radii, shadows) + reset
│   ├── components.css      # Reusable UI: buttons, cards, navbar, footer, pills
│   ├── styles.css          # Page layout, sections, grids, responsive rules
│   └── pages/              # Page-specific styles (one file per page, e.g. about.css)
├── js/
│   ├── data.js             # Cached JSON loader (Data.get / Data.getAll)
│   ├── data-bundle.js      # AUTO-GENERATED snapshot of data/*.json (node tools/build-data.js)
│   ├── components.js       # Reusable components + card renderers + icon set
│   ├── navbar.js           # <site-navbar> custom element
│   ├── footer.js           # <site-footer> custom element
│   ├── dashboard.js        # <dashboard-sidebar> shell + dashboard interactions
│   ├── main.js             # Renders listings into the page, wires interactions
│   └── pages/              # Page-specific scripts (one file per page, e.g. about.js)
│       └── dashboard-actions.js  # Dialogs, dropdowns and toasts shared by
│                               # every dashboard page (data-act handlers)
├── data/                   # JSON: see the rule below
│   ├── site.json
│   ├── services.json
│   ├── freelancers.json
│   └── jobs.json
├── partials/               # Reusable HTML snippets (headers, cards, banners, …)
├── vendor/                 # Third-party libraries (downloaded, not npm-managed)
├── fonts/                  # Web fonts (woff2 files + any @font-face CSS)
├── docs/                   # Notes, specs, screenshots, write-ups
├── tools/
│   ├── build-data.js       # Inlines data/*.json into js/data-bundle.js
│   └── smoke-dashboards.js # Headless Chrome smoke test for the dashboards
│                           # and all dedicated sidebar pages
└── img/                    # SVG artwork (swap for real photos any time)
```

Empty folders contain a `.gitkeep` file so git tracks them; delete it once the folder has real files.
### Adding a new page

1. Create the page at the root, e.g. `about.html` (paths like `css/…`, `js/…`, `img/…` work as-is).
2. Add page-only styles in `css/pages/about.css` and page-only scripts in `js/pages/about.js`; link them after the shared files:
   ```html
   <link rel="stylesheet" href="css/variables.css" />
   <link rel="stylesheet" href="css/components.css" />
   <link rel="stylesheet" href="css/styles.css" />
   <link rel="stylesheet" href="css/pages/about.css" />
   ...
   <script src="js/data.js" defer></script>
   <script src="js/components.js" defer></script>
   <script src="js/pages/about.js" defer></script>
   ```
3. Drop `<site-navbar></site-navbar>` and `<site-footer></site-footer>` in the markup; they fill themselves from `data/site.json`.
4. Load only the JSON the page needs: `Data.getAll(["site", "services"])`.

## What goes in JSON (and what doesn't)

JSON is only for **important, repetitive data, especially anything reused on other pages**:

| File | Contents | Why JSON |
| --- | --- | --- |
| `data/site.json` | Brand, navbar links, dashboard sidebar, footer | Shared by *every* page |
| `data/services.json` | Categories + service listings | Listing data, reused on a services page |
| `data/freelancers.json` | Freelancer profiles | Listing data, reused on a freelancers page |
| `data/jobs.json` | Job listings | Listing data, reused on a jobs page |
| `data/users.json` | Demo accounts: name, email, password, role (`freelancer`, `hire-talent`, `super-admin`) | Checked by the login form and used to build the session |

Everything else is **page-specific copy and stays in `index.html`**: the hero headline, section headings, the "How it works" steps, search placeholder and suggestion chips. Edit those straight in the HTML.

> If you add a page, load only the JSON it actually needs:
> `Data.getAll(["site", "services"])`.

> **After editing or adding a file in `data/`, run `node tools/build-data.js`** to refresh the
> `js/data-bundle.js` snapshot, so the change is visible when the page is opened from disk.

## Reusable components

Navbar and footer are self-rendering custom elements; drop them into any page and they fill themselves from `data/site.json`:

```html
<site-navbar></site-navbar>
<!-- page content -->
<site-footer></site-footer>
```

They require `js/data.js` and `js/components.js` to be loaded first:

```html
<script src="js/data.js" defer></script>
<script src="js/components.js" defer></script>
```

Card markup is generated by pure functions in `js/components.js`, so a new page can reuse the same look:

```js
Components.ServiceCard(service)    // service card
Components.FreelancerCard(person)  // freelancer card
Components.JobCard(job)            // job card
Components.Pill(item, active)      // category chip
```

The home page keeps the shared card components for other pages and renders its
own listings from the pure functions in `js/main.js` (`ServiceCard`,
`FreelancerCard`, `JobCard`), so it can restyle them without touching the
reusable markup. Each section opens with a plain **section head**
(`.section__eyebrow` label, `.section__title` over a short green rule,
`.section__subtitle` and one action button) and the content sits in a
three-up `.cards` grid. The home cards carry their own printed-ticket
material (no banner involved): cream paper stock (`#fffdf7`), a 1.5px ink
rule, a hard `4px 4px 0` offset shadow, and a `.card__stamp` ink tab clipped
into the top-left corner (rating, job badge or step number), with a green
level flag mirrored into the top-right of freelancer photos. Everything is
styled by `css/pages/home.css`.

## Dashboards

`freelancer-dashboard.html` (freelancer accounts), `hire-talent-dashboard.html`
(hire-talent accounts) and `super-admin-dashboard.html` (platform admins) are three
sides of the **same dashboard shell**: sidebar, topbar and stat cards are identical; these pages are the **overview** (welcome header + stats + condensed panels). The panels preview the dedicated pages below and link through to them; every other sidebar
item is its own **dedicated page**, rendered through the same shell (the super admin
gets the Platform menu automatically on every page):

| Page | Who sees it | Contents |
| --- | --- | --- |
| `projects.html` | freelancer, hire-talent | Active projects / engagements in flight |
| `applications.html` | freelancer, hire-talent | Recent proposals / new applications |
| `messages.html` | freelancer, hire-talent | Recent conversations |
| `payments.html` | freelancer, hire-talent | Earnings + payout / spending + escrow |
| `activity.html` | everyone | Timeline of the week, per role |
| `users.html` | super-admin | New and verifying members |
| `moderation.html` | super-admin | Queue of flagged items |
| `reports.html` | super-admin | Open reports by urgency |
| `revenue.html` | super-admin | Platform fees and monthly trend |
| `profile.html` | everyone | Edit profile: form pre-filled from the session, persisted to `skillmarket.profile.<role>` and patched back into the session via `Session.update()` |
| `settings.html` | everyone | Notification switches: inline, persisted to `skillmarket.settings.<role>` (same key as the settings dialog) |

Shared pages carry one copy of the panel per role they serve, wrapped in
`[data-role-block]`; the block matching the signed-in role stays in the DOM and the
rest are removed at boot, so ids stay unique and search only sees the role's markup.
Pages declare their audience on `<body data-roles="…">`; anyone else is bounced to
their own dashboard. Single-role pages carry no role blocks.

- **Shell**: `<dashboard-sidebar>` in `js/dashboard.js` renders the navigation from
  `data/site.json` → `dashboard`, so every page always shares one sidebar. A page can
  pass `data-variant="…"` to force a nav variant; otherwise the signed-in role picks
  one automatically (super admin → Platform menu). Sidebar hrefs may contain the
  token `{dash}`, which is swapped for the role's dashboard file at render time
  (collapsing to a same-page `#anchor` on the dashboard itself). Keep
  `node tools/build-data.js` run after editing `data/site.json`. The topbar
  (search where there is something to search, notifications, account chip) lives in
  each page's markup.
- **Look**: the overview header (`.dash__head`) is a clean, on-brand welcome
  card: a solid green surface (no gradient) with a single-line greeting and
  subtitle, anchored by the SM mark (`img/logo-2.png`, knocked out to white)
  on the right-hand side and no action buttons. Only the three overview
  dashboards show it; every other sidebar page opens with a plain, unboxed
  `.page__head` heading row instead.
- **Interactions**: mobile drawer with `aria-expanded`, the link for the current
  page marked active (same-page `page.html#id` links are understood), topbar search
  that filters list rows (with an empty state), and a shared action layer in
  `js/pages/dashboard-actions.js` that makes **every** button do something real:
  dialogs, dropdowns, toasts, form validation, queue moderation and CSV export.
  Controls declare their behaviour with `data-act="…"` keys; `#help` opens a dialog,
  and sidebar items are plain links to their dedicated pages.

### Adding a dashboard action

1. Add a `data-act="my-key"` attribute to the control in any dashboard HTML.
2. Register `my-key` in the `ACTIONS` map in `js/pages/dashboard-actions.js`: a function that opens a dialog (`openModal` / `formModal` / `queueModal`),
   a dropdown (`openDrop`) or fires a `toast`.
3. Reusable dialog builders: `openModal`, `formModal` (validated fields),
   `queueModal` (approve/reject rows that update a stat + timeline),
   `switchDialog` (persisted toggles), `openInbox` (thread + compose),
   `listDialog` / `tableDialog` (full lists and history tables).

## Interactions

- **Search box**: filters the services grid live; submitting scrolls to the results.
- **Suggestion chips**: fill the search box and run the search.
- **Category pills**: filter by category; "All Categories" restores the full list.
- **Mobile nav**: hamburger toggle with `aria-expanded`, closes on resize/link click.
- **Empty state**: shown when nothing matches the search.
- **Load failure**: if neither `data/*.json` nor the `js/data-bundle.js` snapshot can be read, the error is logged to the browser console.
- **Dashboard buttons**: every `data-act` control opens working content: settings and
  security switches persist to `localStorage` (`skillmarket.settings.<role>`), the
  inbox sends messages back into the panel preview, moderation actions decrement their
  stat and prepend to the activity timeline, and money forms validate before showing a
  success receipt. The Edit profile panel fills its form from the session and
  `skillmarket.profile.<role>`; the Active switch toggles availability, and Save
  changes patches the session (`Session.update()`) so the topbar chip updates at once.
- **Dashboard smoke test**: `node tools/smoke-dashboards.js` boots headless Chrome
  over CDP, seeds a session per role, clicks every `data-act` control, sidebar link
  and row on each dashboard **and** on every dedicated sidebar page, checks that
  blocked roles are bounced to their own dashboard; the sidebar hrefs resolve
  to the right pages and that the settings switches persist; the run fails (exit 1) on
  any control with no effect, empty dialog or console error. Screenshots land in
  `%TEMP%\sm-shots`.

## Editing the design

- Colors, radii, shadows and layout width → `css/variables.css`
- Button / card / navbar / footer components → `css/components.css` (rendered
  by the card functions in `js/components.js`)
- Section spacing, grids and breakpoints → `css/styles.css`
- Page-specific styles → `css/pages/*.css`

**Design rules: no gradients, no glows, no glass, no stock icons.**
- Surfaces are flat and opaque: solid `background` and `border` colours from
  `css/variables.css`; never translucent fills such as `rgba(255, 255, 255, 0.x)`
  tints over a coloured/dark surface, and never `backdrop-filter`.
- No `linear-gradient` or `radial-gradient` anywhere, including the artwork in
  `img/` (flatten SVG artwork to solid fills instead).
- No blurred or coloured glow shadows; focus and active states use flat,
  opaque ring shadows (for example `0 0 0 3px var(--green-200)`).
- Icons come from the hand-drawn SkillMarket set in `js/components.js`
  (solid silhouettes on a 24px grid) rendered with `Icons.svg()`, or the
  matching inline `<svg viewBox="0 0 24 24" fill="currentColor">` markup.
  Do not add stock outline icon sets.
- Buttons (and other controls) always get solid, opaque `background` and
  `border` colours; if a translucent tint looks right, flatten it to the
  equivalent opaque hex instead.
- No em dashes in copy or comments; use a comma, colon or full stop.

## Replacing the artwork

Images in `img/` are hand-made SVG placeholders so the page works offline. To use real photos, drop your files into `img/` and update the `image` fields in `data/services.json` and `data/freelancers.json`.
