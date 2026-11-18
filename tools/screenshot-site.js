/**
 * Temporary visual check harness: loads each key page over file://,
 * seeds a freelancer session for dashboard pages, and writes full-page
 * PNG screenshots into the given output directory.
 *
 *   node tools/screenshot-site.js <out-dir> [page ...]
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.resolve(process.argv[2] || "shots");
const ONLY = process.argv.slice(3).filter((a) => !a.startsWith("--"));
const VIEWPORT_ONLY = process.argv.includes("--viewport");
const PORT = 9344;
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const USERS = {
  freelancer: { email: "sabrieladriel@skillmarket.com", name: "Sabriel Adrian", role: "freelancer" },
  "hire-talent": { email: "chrisemerson@skillmarket.com", name: "Chris Emerson", role: "hire-talent" },
  "super-admin": { email: "kleinwesley@skillmarket.com", name: "Klein Wesley", role: "super-admin" }
};

const PAGES = [
  { file: "index.html" },
  { file: "explore.html" },
  { file: "freelancers.html" },
  { file: "jobs.html" },
  { file: "freelancer-details.html?id=flw-001" },
  { file: "service-details.html?id=svc-001" },
  { file: "job-details.html?id=job-001" },
  { file: "premium.html" },
  { file: "login.html" },
  { file: "join.html" },
  { file: "become-freelancer.html" },
  { file: "hire-talent.html" },
  { file: "freelancer-dashboard.html", role: "freelancer" },
  { file: "projects.html", role: "freelancer" },
  { file: "messages.html", role: "freelancer" },
  { file: "payments.html", role: "freelancer" },
  { file: "settings.html", role: "freelancer" },
  { file: "hire-talent-dashboard.html", role: "hire-talent" },
  { file: "super-admin-dashboard.html", role: "super-admin" },
  { file: "moderation.html", role: "super-admin" }
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result || {});
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

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  return new CDP(ws);
}

const pageUrl = (file) => "file:///" + path.join(ROOT, file).replace(/\\/g, "/");
const slug = (file) =>
  file.replace(/\.html.*$/, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "sm-shots-"));
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

  try {
    await waitEndpoint();
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const page = list.find((t) => t.type === "page");
    const cdp = await connect(page.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    const targets = PAGES.filter((p) => !ONLY.length || ONLY.some((o) => p.file.startsWith(o)));

    for (const target of targets) {
      if (target.role) {
        await cdp.send("Page.navigate", { url: pageUrl("login.html") });
        await sleep(600);
        await cdp.evaluate(
          `localStorage.setItem("skillmarket.session", ${JSON.stringify(JSON.stringify(USERS[target.role]))}); "ok"`
        );
      }
      await cdp.send("Page.navigate", { url: pageUrl(target.file) });
      await sleep(1400);
      // Force IntersectionObserver-driven reveals (js/reveal.js) so
      // full-page captures don't snapshot the pre-reveal hidden state.
      await cdp.evaluate(
        `(async () => {
          const h = document.documentElement.scrollHeight;
          for (let y = 0; y < h; y += 400) {
            window.scrollTo({ top: y, behavior: "instant" });
            await new Promise((r) => setTimeout(r, 60));
          }
          window.scrollTo({ top: 0, behavior: "instant" });
          return "scrolled";
        })()`
      );
      await sleep(650);
      if (!VIEWPORT_ONLY) {
        // Walk the page so scroll-reveal content triggers, then return
        // to the top so the beyond-viewport capture shows everything.
        await cdp.evaluate(
          `(async () => {
            const step = Math.max(300, Math.floor(window.innerHeight * 0.8));
            const max = document.documentElement.scrollHeight;
            for (let y = 0; y < max; y += step) {
              // "instant": the stylesheet sets scroll-behavior: smooth,
              // which would animate every step and defeat the sweep.
              window.scrollTo({ top: y, behavior: "instant" });
              await new Promise((r) => setTimeout(r, 100));
            }
            window.scrollTo({ top: max, behavior: "instant" });
            await new Promise((r) => setTimeout(r, 100));
            window.scrollTo({ top: 0, behavior: "instant" });
            return "done";
          })()`
        );
        await sleep(800);
      }
      const { data } = await cdp.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: !VIEWPORT_ONLY
      });
      const name = slug(target.file) + ".png";
      fs.writeFileSync(path.join(OUT, name), Buffer.from(data, "base64"));
      console.log("shot", name);
    }
  } finally {
    chrome.kill();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
