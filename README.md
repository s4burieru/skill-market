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
├── freelancer-dashboard.html   # Dashboard for freelancer accounts
├── hire-talent-dashboard.html  # Dashboard for hire-talent accounts
│                           # Both share one shell (sidebar + topbar); only the
│                           # content inside the panels differs.
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
│   └── build-data.js       # Inlines data/*.json into js/data-bundle.js
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
| `data/site.json` | Brand, navbar links, dashboard sidebar, CTA banner, footer | Shared by *every* page |
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
Components.Cta(site.cta)           // green call-to-action band
Components.Pill(item, active)      // category chip
```

## Dashboards

`freelancer-dashboard.html` (freelancer accounts) and `hire-talent-dashboard.html`
(hire-talent accounts) are two sides of the **same dashboard shell**: sidebar, topbar,
stat cards, panel grid and footer actions are byte-for-byte identical — only the
content inside the panels differs.

- **Shell** — `<dashboard-sidebar>` in `js/dashboard.js` renders the navigation from
  `data/site.json` → `dashboard`, so both pages always share one sidebar. The topbar
  (search, notifications, account chip) lives in each page's markup.
- **Layout & widgets** — `css/pages/dashboard.css`: sidebar, topbar, `.stat` cards,
  `.panel`, list rows, status chips, progress bars, checklist, bar chart and timeline.
  Everything is built from the existing tokens and `.btn` / `.chip` / `.badge` /
  `.search` components.
- **Interactions** — mobile drawer with `aria-expanded`, scroll-spy that highlights the
  active section, topbar search that filters list rows (with an empty state), and
  inert `data-notice` placeholder buttons that do nothing when clicked.

## Interactions

- **Search box**: filters the services grid live; submitting scrolls to the results.
- **Suggestion chips**: fill the search box and run the search.
- **Category pills**: filter by category; "All Categories" restores the popular list.
- **Mobile nav**: hamburger toggle with `aria-expanded`, closes on resize/link click.
- **Empty state**: shown when nothing matches the search.
- **Load failure**: if neither `data/*.json` nor the `js/data-bundle.js` snapshot can be read, the error is logged to the browser console.

## Editing the design

- Colors, radii, shadows and layout width → `css/variables.css`
- Button / card / navbar / footer styles → `css/components.css`
- Section spacing, grids and breakpoints → `css/styles.css`

**Design rule: no glass/frosted buttons.** Buttons (and other controls) always get
solid, opaque `background` and `border` colours — never translucent fills such as
`rgba(255, 255, 255, 0.x)` tints over a coloured/dark surface, and never
`backdrop-filter: blur()` on a control. If a translucent tint looks right, flatten
it to the equivalent opaque hex instead.

## Replacing the artwork

Images in `img/` are hand-made SVG placeholders so the page works offline. To use real photos, drop your files into `img/` and update the `image` fields in `data/services.json` and `data/freelancers.json`.
