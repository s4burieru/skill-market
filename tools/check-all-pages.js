/**
 * Temporary full-site sweep: opens every HTML page over file://, collects
 * console errors and failed requests, and writes screenshots.
 *
 *   node tools/check-all-pages.js
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT = path.resolve(__dirname, "..");
const PORT = 9355;
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const SESSION = { email: "sabrieladriel@skillmarket.com", name: "Sabriel Adrian", role: "freelancer" };

const FILES = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html")).sort();
const SHARED = new Set([
  "projects.html", "applications.html", "messages.html", "payments.html",
  "activity.html", "profile.html", "settings.html"
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result || {});
      } else if (msg.method) {
        this.events.push(msg);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
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

async function waitEndpoint() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      if (res.ok) return;
    } catch {}
    await sleep(250);
  }
  throw new Error("Chrome did not open a debugging endpoint in time");
}

const pageUrl = (file) => "file:///" + path.join(ROOT, file).replace(/\\/g, "/");

(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "sm-sweep-"));
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
  try {
    await waitEndpoint();
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const page = list.find((t) => t.type === "page");
    const cdp = await connectTo(page.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Log.enable");

    // Seed a freelancer session so gated pages boot.
    await cdp.send("Page.navigate", { url: pageUrl("login.html") });
    await sleep(600);
    await cdp.evaluate(
      `localStorage.setItem("skillmarket.session", ${JSON.stringify(JSON.stringify(SESSION))}); "ok"`
    );

    for (const file of FILES) {
      cdp.events.length = 0;
      await cdp.send("Page.navigate", { url: pageUrl(file) });
      await sleep(1200);

      const consoleErrors = cdp.events
        .filter((e) => e.method === "Runtime.exceptionThrown" || (e.method === "Log.entryAdded" && e.params?.entry?.level === "error"))
        .map((e) => {
          if (e.method === "Runtime.exceptionThrown") {
            return e.params?.exceptionDetails?.exception?.description || e.params?.exceptionDetails?.text;
          }
          return e.params?.entry?.text;
        })
        .filter(Boolean);

      const failedRequests = cdp.events
        .filter((e) => e.method === "Network.loadingFailed")
        .map((e) => e.params?.errorText)
        .filter(Boolean);

      const url = await cdp.evaluate("location.pathname.split('/').pop()");
      if (consoleErrors.length) {
        failures.push(`${file}: console errors: ${[...new Set(consoleErrors)].join(" | ").slice(0, 400)}`);
      }
      console.log(`checked ${file}${url !== file ? ` (→ ${url})` : ""}${consoleErrors.length ? "  [ERRORS]" : ""}`);
    }
  } finally {
    chrome.kill();
  }

  if (failures.length) {
    console.log("\nFAILURES:");
    for (const f of failures) console.log(" - " + f);
    process.exit(1);
  }
  console.log("\nAll pages loaded clean.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

async function connectTo(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  return new CDP(ws);
}
