/**
 * Headless smoke test for the three SkillMarket dashboards.
 *
 * Boots Chrome over CDP, seeds a session for a role, then clicks every
 * [data-act] control, every clickable row and the sidebar dialogs,
 * asserting that each one produces a visible effect (dialog, dropdown or
 * toast) with no console errors.
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

  try {
    await waitEndpoint();
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const page = list.find((t) => t.type === "page");
    const cdp = await connect(page.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Log.enable");

    for (const [role, file] of Object.entries(PAGES)) {
      const url = "file:///" + path.join(ROOT, file).replace(/\\/g, "/");
      const errors = [];

      // Seed the session on the origin before the dashboard boots.
      await cdp.send("Page.navigate", { url: "file:///" + path.join(ROOT, "login.html").replace(/\\/g, "/") });
      await sleep(500);
      await cdp.evaluate(
        `localStorage.setItem("skillmarket.session", ${JSON.stringify(JSON.stringify(USERS[role]))}); "ok"`
      );

      cdp.events.length = 0;
      await cdp.send("Page.navigate", { url });
      await sleep(1400);

      const state = await cdp.evaluate(`(() => ({
        title: document.title,
        hasSidebar: !!document.querySelector(".sidebar__link"),
        acts: document.querySelectorAll("[data-act]").length,
        rows: document.querySelectorAll(".dash__grid .list__item").length,
        titleText: (document.querySelector(".dash__title") || {}).textContent || "",
        url: location.pathname.split("/").pop()
      }))()`);
      report.push({ role, ...state });

      if (state.url !== file) {
        failures.push(`${role}: redirected to ${state.url} (expected ${file})`);
      }
      if (!state.hasSidebar) failures.push(`${role}: sidebar did not render`);
      if (state.acts === 0) failures.push(`${role}: no [data-act] controls found`);

      // --- Every data-act control -------------------------------------
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
          failures.push(`${role}: [data-act=${item.act}] produced no effect (${item.tag} "${item.text}")`);
        } else if (result.effect.startsWith("modal:") && result.body < 20) {
          failures.push(`${role}: [data-act=${item.act}] opened an empty dialog`);
        }

        // Reset: close dialog / dropdown / toasts before the next click.
        await cdp.evaluate(`(async () => {
          document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
          const m = document.querySelector("[data-modal]");
          if (m) { m.hidden = true; document.body.classList.remove("is-modal-open"); document.documentElement.classList.remove("is-modal-open"); }
          document.querySelectorAll(".drop").forEach((d) => d.remove());
          document.querySelectorAll(".toasts").forEach((t) => t.remove());
          await new Promise((r) => setTimeout(r, 60));
        })()`);
      }

      // --- Sidebar #settings / #help ----------------------------------
      const side = await cdp.evaluate(`(async () => {
        const out = [];
        for (const href of ["#settings", "#help"]) {
          const a = document.querySelector('.sidebar__link[href="' + href + '"]');
          if (!a) { out.push({ href, ok: false, why: "link missing" }); continue; }
          a.click();
          await new Promise((r) => setTimeout(r, 260));
          const m = document.querySelector("[data-modal]");
          const open = m && !m.hidden;
          out.push({ href, ok: !!open, title: open ? (m.querySelector("[data-modal-title]")||{}).textContent : "" });
          if (m) { m.hidden = true; document.body.classList.remove("is-modal-open"); document.documentElement.classList.remove("is-modal-open"); }
        }
        return out;
      })()`);
      for (const s of side) {
        if (!s.ok) failures.push(`${role}: sidebar ${s.href} did not open a dialog`);
      }

      // --- Clickable rows ---------------------------------------------
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
        failures.push(`${role}: none of the ${rowCheck.total} sampled rows opened a detail dialog`);
      }

      // --- Console errors ---------------------------------------------
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
      for (const e of errors) failures.push(`${role}: console error — ${e}`);

      report.push({ role, acts: acts.length, rows: rowCheck, side: side.map((s) => s.href + "=" + (s.ok ? "ok" : "FAIL")) });
    }

    // --- CSV export sanity (Blob + anchor, no real download) -----------
    await cdp.send("Page.navigate", { url: "file:///" + path.join(ROOT, PAGES["super-admin"]).replace(/\\/g, "/") });
    await sleep(1400);
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
    if (!csv.ok) failures.push(`super-admin: export-report did not create a CSV blob download`);

    // --- Screenshots ---------------------------------------------------
    const shots = path.join(os.tmpdir(), "sm-shots");
    fs.mkdirSync(shots, { recursive: true });
    for (const [role, file] of Object.entries(PAGES)) {
      await cdp.send("Page.navigate", { url: "file:///" + path.join(ROOT, file).replace(/\\/g, "/") });
      await sleep(1300);
      const shot = await cdp.send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(path.join(shots, `${role}.png`), Buffer.from(shot.data, "base64"));
      // Dialog shot
      await cdp.evaluate(`(() => {
        const b = document.querySelector('[data-act="profile-preview"]') || document.querySelector('[data-act="settings"]');
        if (b) b.click();
      })()`);
      await sleep(500);
      const shot2 = await cdp.send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(path.join(shots, `${role}-dialog.png`), Buffer.from(shot2.data, "base64"));
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
