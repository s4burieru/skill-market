/**
 * Headless smoke test for the SkillMarket dashboards and every dedicated
 * sidebar page (projects, applications, messages, payments, activity,
 * users, moderation, reports, revenue, profile, settings).
 *
 * Boots Chrome over CDP, seeds a session per role, then for each page
 * asserts that the sidebar renders with the right targets, clicks every
 * [data-act] control and every clickable row and checks that each one
 * produces a visible effect (dialog, dropdown or toast), with no console
 * errors. Also verifies that pages a role may not open bounce back to
 * that role's dashboard.
 *
 *   node tools/smoke-dashboards.js
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT = path.resolve(__dirname, "..");
const PORT = 9333;
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const USERS = {
  freelancer: { email: "sabrieladriel@skillmarket.com", name: "Sabriel Adrian", role: "freelancer" },
  "hire-talent": { email: "chrisemerson@skillmarket.com", name: "Chris Emerson", role: "hire-talent" },
  "super-admin": { email: "kleinwesley@skillmarket.com", name: "Klein Wesley", role: "super-admin" }
};

const PAGES = {
  freelancer: "freelancer-dashboard.html",
  "hire-talent": "hire-talent-dashboard.html",
  "super-admin": "super-admin-dashboard.html"
};

// Dedicated sidebar pages shared by several roles. `roles` gates who may
// open the page; `multi` marks pages carrying one [data-role-block] per
// role (single-role pages have no blocks); `rows` flags pages whose rows
// should open detail dialogs.
const SHARED = [
  { file: "projects.html", rows: true, multi: true, roles: ["freelancer", "hire-talent"] },
  { file: "applications.html", rows: true, multi: true, roles: ["freelancer", "hire-talent"] },
  { file: "messages.html", rows: true, multi: true, roles: ["freelancer", "hire-talent"] },
  { file: "payments.html", rows: false, multi: true, roles: ["freelancer", "hire-talent"] },
  { file: "activity.html", rows: false, multi: true, roles: ["freelancer", "hire-talent", "super-admin"] },
  { file: "users.html", rows: true, multi: false, roles: ["super-admin"] },
  { file: "moderation.html", rows: true, multi: false, roles: ["super-admin"] },
  { file: "reports.html", rows: true, multi: false, roles: ["super-admin"] },
  { file: "revenue.html", rows: false, multi: false, roles: ["super-admin"] },
  { file: "profile.html", rows: false, multi: true, roles: ["freelancer", "hire-talent", "super-admin"] },
  { file: "settings.html", rows: false, multi: true, roles: ["freelancer", "hire-talent", "super-admin"], settings: true }
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitEndpoint() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return;
    } catch (error) {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error("Chrome DevTools endpoint never came up");
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    ws.addEventListener("message", (raw) => {
      const msg = JSON.parse(raw.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  async evaluate(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || "evaluation failed");
    }
    return res.result?.value;
  }
}

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  return new CDP(ws);
}

async function main() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "sm-chrome-"));
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--window-size=1440,1000",
      "--allow-file-access-from-files",
      "about:blank"
    ],
    { stdio: "ignore" }
  );

  const failures = [];
  const report = [];

  const pageUrl = (file) =>
    "file:///" + path.join(ROOT, file).replace(/\\/g, "/");

  // Reset dialogs / dropdowns / toasts between interaction probes.
  const resetPage = (cdp) =>
    cdp.evaluate(`(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      const m = document.querySelector("[data-modal]");
      if (m) { m.hidden = true; document.body.classList.remove("is-modal-open"); document.documentElement.classList.remove("is-modal-open"); }
      document.querySelectorAll(".drop").forEach((d) => d.remove());
      document.querySelectorAll(".toasts").forEach((t) => t.remove());
      await new Promise((r) => setTimeout(r, 60));
    })()`);

  // Click every [data-act] control on the current page and check it does something.
  async function clickDataActs(cdp, label) {
    const acts = await cdp.evaluate(
      `Array.from(document.querySelectorAll("[data-act]")).map((el, i) => ({
         i,
         act: el.dataset.act,
         tag: el.tagName,
         text: (el.textContent || "").trim().slice(0, 40)
       }))`
    );

    for (const item of acts) {
      const result = await cdp.evaluate(`(async () => {
        const el = document.querySelectorAll("[data-act]")[${item.i}];
        if (!el) return { ok: false, why: "gone" };
        el.scrollIntoView({ block: "center" });
        el.click();
        await new Promise((r) => setTimeout(r, 260));
        const modal = document.querySelector("[data-modal]");
        const drop = document.querySelector(".drop");
        const toast = document.querySelector(".toasts .toast");
        const open = modal && !modal.hidden;
        const title = open ? (modal.querySelector("[data-modal-title]") || {}).textContent : "";
        const effect = open ? "modal:" + (title || "?") : drop ? "drop" : toast ? "toast" : "none";
        return { ok: open || !!drop || !!toast, effect, body: open ? (modal.querySelector("[data-modal-body]") || {}).innerHTML.length : 0 };
      })()`);

      if (!result.ok) {
        failures.push(`${label}: [data-act=${item.act}] produced no effect (${item.tag} "${item.text}")`);
      } else if (result.effect.startsWith("modal:") && result.body < 20) {
        failures.push(`${label}: [data-act=${item.act}] opened an empty dialog`);
      }

      await resetPage(cdp);
    }

    return acts.length;
  }

  // Sidebar rendering + href targets + the help dialog.
  async function checkSidebar(cdp, label, role) {
    const dash = PAGES[role];

    const side = await cdp.evaluate(`(async () => {
      const q = (sel) => document.querySelector(sel);
      const href = (sel) => { const a = q(sel); return a ? a.getAttribute("href") : null; };

      const out = {
        hasSidebar: !!q(".sidebar__link"),
        overview: href('.sidebar__link[href$="overview"], .sidebar__link[href="#overview"]'),
        settings: href('.sidebar__link[href="settings.html"]'),
        profile: href('.sidebar__link[href="profile.html"]'),
        projects: href('.sidebar__link[href="projects.html"]'),
        users: href('.sidebar__link[href="users.html"]'),
        helpOpensDialog: false
      };

      const help = q('.sidebar__link[href="#help"]');
      if (help) {
        help.click();
        await new Promise((r) => setTimeout(r, 260));
        const m = q("[data-modal]");
        out.helpOpensDialog = !!(m && !m.hidden);
        if (m) { m.hidden = true; document.body.classList.remove("is-modal-open"); document.documentElement.classList.remove("is-modal-open"); }
      }
      return out;
    })()`);

    if (!side.hasSidebar) failures.push(`${label}: sidebar did not render`);
    if (side.overview !== "#overview" && side.overview !== `${dash}#overview`) {
      failures.push(`${label}: overview link points at ${side.overview} (expected #overview or ${dash}#overview)`);
    }
    if (side.settings !== "settings.html") {
      failures.push(`${label}: settings link points at ${side.settings} (expected settings.html)`);
    }
    if (side.profile !== "profile.html") {
      failures.push(`${label}: profile link points at ${side.profile} (expected profile.html)`);
    }
    if (role === "super-admin") {
      if (side.users !== "users.html") {
        failures.push(`${label}: users link points at ${side.users} (expected users.html)`);
      }
    } else if (side.projects !== "projects.html") {
      failures.push(`${label}: projects link points at ${side.projects} (expected projects.html)`);
    }
    if (!side.helpOpensDialog) failures.push(`${label}: sidebar help link did not open a dialog`);

    return side;
  }

  // Exactly one role block may remain, and it must be the role's own.
  async function checkRoleBlock(cdp, label, role) {
    const state = await cdp.evaluate(`(() => {
      const blocks = Array.from(document.querySelectorAll("[data-role-block]"));
      return {
        count: blocks.length,
        roles: blocks.map((b) => b.dataset.roleBlock),
        anyHidden: blocks.some((b) => b.hasAttribute("hidden"))
      };
    })()`);
    if (state.count !== 1 || state.roles[0] !== role) {
      failures.push(`${label}: expected exactly one [data-role-block="${role}"], got ${JSON.stringify(state)}`);
    }
    if (state.anyHidden) failures.push(`${label}: the surviving role block is still hidden`);
    return state;
  }

  async function checkUniqueIds(cdp, label) {
    const dupes = await cdp.evaluate(`(() => {
      const seen = new Map();
      document.querySelectorAll("[id]").forEach((el) => seen.set(el.id, (seen.get(el.id) || 0) + 1));
      return Array.from(seen.entries()).filter(([, count]) => count > 1).map(([id]) => id);
    })()`);
    if (dupes.length) failures.push(`${label}: duplicate ids in document, ${dupes.join(", ")}`);
  }

  // The account page's inline switches must persist to the same
  // localStorage key the settings dialog uses.
  async function checkSettingsSwitch(cdp, label, role) {
    const result = await cdp.evaluate(`(async () => {
      const block = document.querySelector('[data-setting-block="${role}"]');
      if (!block) return { ok: false, why: "switch block missing" };
      const key = "skillmarket.settings.${role}";
      const btn = block.querySelector("[data-setting-key]");
      const settingKey = btn.dataset.settingKey;
      const before = btn.getAttribute("aria-checked") === "true";
      btn.click();
      await new Promise((r) => setTimeout(r, 200));
      const stored = JSON.parse(localStorage.getItem(key) || "{}");
      const toast = !!document.querySelector(".toasts .toast");
      btn.click(); // restore
      await new Promise((r) => setTimeout(r, 120));
      return { ok: stored[settingKey] === !before && toast, settingKey, before, stored: stored[settingKey], toast };
    })()`);
    if (!result.ok) {
      failures.push(`${label}: settings switch did not persist, ${JSON.stringify(result)}`);
    }
    return result;
  }

  async function checkRows(cdp, label) {
    const rowCheck = await cdp.evaluate(`(async () => {
      const rows = Array.from(document.querySelectorAll(".dash__grid .list__item")).slice(0, 6);
      let opened = 0, skipped = 0;
      for (const row of rows) {
        row.click();
        await new Promise((r) => setTimeout(r, 220));
        const m = document.querySelector("[data-modal]");
        if (m && !m.hidden) {
          opened++;
          m.hidden = true;
          document.body.classList.remove("is-modal-open");
          document.documentElement.classList.remove("is-modal-open");
        } else { skipped++; }
        document.querySelectorAll(".toasts").forEach((t) => t.remove());
      }
      return { total: rows.length, opened, skipped };
    })()`);
    if (rowCheck.opened === 0) {
      failures.push(`${label}: none of the ${rowCheck.total} sampled rows opened a detail dialog`);
    }
    return rowCheck;
  }

  const drainConsoleErrors = (cdp, label) => {
    const errors = [];
    for (const ev of cdp.events) {
      if (ev.method === "Runtime.exceptionThrown") {
        errors.push(ev.params.exceptionDetails?.exception?.description || "exception");
      }
      if (ev.method === "Log.entryAdded" && ev.params.entry.level === "error") {
        const text = ev.params.entry.text;
        // file:// pages have no server; a favicon 404 is not a code error.
        if (!/favicon/i.test(text)) errors.push(text);
      }
      if (ev.method === "Runtime.consoleAPICalled" && ev.params.type === "error") {
        errors.push(ev.params.args.map((a) => a.value || a.description).join(" "));
      }
    }
    for (const e of errors) failures.push(`${label}: console error, ${e}`);
  };

  try {
    await waitEndpoint();
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const page = list.find((t) => t.type === "page");
    const cdp = await connect(page.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Log.enable");

    for (const [role, file] of Object.entries(PAGES)) {
      // Seed the session on the origin before any dashboard boots.
      await cdp.send("Page.navigate", { url: pageUrl("login.html") });
      await sleep(500);
      await cdp.evaluate(
        `localStorage.setItem("skillmarket.session", ${JSON.stringify(JSON.stringify(USERS[role]))}); "ok"`
      );

      const targets = [{ file, rows: false }, ...SHARED.filter((p) => p.roles.includes(role))];

      for (const target of targets) {
        const label = `${role}@${target.file}`;
        cdp.events.length = 0;
        await cdp.send("Page.navigate", { url: pageUrl(target.file) });
        await sleep(1300);

        const state = await cdp.evaluate(`(() => ({
          title: document.title,
          hasSidebar: !!document.querySelector(".sidebar__link"),
          acts: document.querySelectorAll("[data-act]").length,
          url: location.pathname.split("/").pop()
        }))()`);
        report.push({ role, file: target.file, ...state });

        if (state.url !== target.file) {
          failures.push(`${label}: redirected to ${state.url} (expected ${target.file})`);
        }
        if (!state.hasSidebar) failures.push(`${label}: sidebar did not render`);
        if (state.acts === 0) failures.push(`${label}: no [data-act] controls found`);

        await checkSidebar(cdp, label, role);

        if (target.file !== PAGES[role]) {
          if (target.multi) await checkRoleBlock(cdp, label, role);
          await checkUniqueIds(cdp, label);
        }

        // "Back to overview" must point at the role's dashboard.
        const dashHome = await cdp.evaluate(
          `(() => { const a = document.querySelector("[data-dash-home]"); return a ? a.getAttribute("href") : null; })()`
        );
        if (target.file !== PAGES[role] && dashHome !== PAGES[role]) {
          failures.push(`${label}: data-dash-home link points at ${dashHome} (expected ${PAGES[role]})`);
        }

        const acts = await clickDataActs(cdp, label);

        let rowCheck = null;
        if (target.rows) rowCheck = await checkRows(cdp, label);

        let switchCheck = null;
        if (target.settings) switchCheck = await checkSettingsSwitch(cdp, label, role);

        drainConsoleErrors(cdp, label);
        report.push({ role, file: target.file, acts, rows: rowCheck, switch: switchCheck });
      }

      // --- Cross-role pages must bounce to the role's own dashboard -----
      const blocked = SHARED.filter((p) => !p.roles.includes(role)).slice(0, 2);
      for (const target of blocked) {
        const label = `${role}@${target.file} (blocked)`;
        cdp.events.length = 0;
        await cdp.send("Page.navigate", { url: pageUrl(target.file) });
        // The guard redirects in two steps (load → replace), so poll until
        // the URL settles or we time out.
        let landed = target.file;
        for (let i = 0; i < 25; i++) {
          await sleep(200);
          landed = await cdp.evaluate(`location.pathname.split("/").pop()`);
          if (landed !== target.file) break;
        }
        if (landed !== PAGES[role]) {
          failures.push(`${label}: expected redirect to ${PAGES[role]}, landed on ${landed}`);
        }
        drainConsoleErrors(cdp, label);
      }
    }

    // --- CSV export sanity (Blob + anchor, no real download) -----------
    // The loop leaves the super-admin session seeded; re-seed to be safe.
    await cdp.send("Page.navigate", { url: pageUrl("login.html") });
    await sleep(400);
    await cdp.evaluate(
      `localStorage.setItem("skillmarket.session", ${JSON.stringify(JSON.stringify(USERS["super-admin"]))}); "ok"`
    );
    await cdp.send("Page.navigate", { url: pageUrl("revenue.html") });
    await sleep(1300);
    await cdp.evaluate(`window.__csv = null;
      const orig = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () { window.__csv = { href: this.href.slice(0, 5), name: this.download }; };`);
    const csv = await cdp.evaluate(`(async () => {
      const btn = document.querySelector('[data-act="export-report"]');
      if (!btn) return { ok: false, why: "button missing" };
      btn.click();
      await new Promise((r) => setTimeout(r, 400));
      return { ok: window.__csv && window.__csv.href === "blob:", name: window.__csv && window.__csv.name };
    })()`);
    if (!csv.ok) failures.push(`super-admin@revenue.html: export-report did not create a CSV blob download`);

    // --- Screenshots ---------------------------------------------------
    const shots = path.join(os.tmpdir(), "sm-shots");
    fs.mkdirSync(shots, { recursive: true });
    for (const [role, file] of Object.entries(PAGES)) {
      await cdp.send("Page.navigate", { url: pageUrl("login.html") });
      await sleep(400);
      await cdp.evaluate(
        `localStorage.setItem("skillmarket.session", ${JSON.stringify(JSON.stringify(USERS[role]))}); "ok"`
      );

      const shotsFor = [file, ...SHARED.filter((p) => p.roles.includes(role)).map((p) => p.file)];
      for (const shot of shotsFor) {
        await cdp.send("Page.navigate", { url: pageUrl(shot) });
        await sleep(1100);
        const name = shot.replace(".html", "");
        const image = await cdp.send("Page.captureScreenshot", { format: "png" });
        fs.writeFileSync(path.join(shots, `${role}-${name}.png`), Buffer.from(image.data, "base64"));
      }

      // Dialog shot: open the profile page's preview.
      await cdp.send("Page.navigate", { url: pageUrl("profile.html") });
      await sleep(1100);
      await cdp.evaluate(`(() => {
        const b = document.querySelector('[data-act="profile-preview"]') || document.querySelector('[data-act="settings"]');
        if (b) b.click();
      })()`);
      await sleep(500);
      const dialog = await cdp.send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(path.join(shots, `${role}-dialog.png`), Buffer.from(dialog.data, "base64"));
      await cdp.evaluate(`document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}));`);
    }
    report.push({ screenshots: shots });
  } finally {
    chrome.kill();
  }

  console.log(JSON.stringify({ report, failures }, null, 2));
  process.exit(failures.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
