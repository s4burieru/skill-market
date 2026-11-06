/**
 * Shared sign-in state for every page.
 *
 * The account lives in data/users.json; once login succeeds we keep a small
 * session record (email, name, role) in storage so the navbar, the auth pages
 * and the dashboards can all agree on who is signed in.
 *
 * - "Keep me signed in"      -> localStorage (survives the browser session)
 * - unchecked                -> sessionStorage (cleared when the tab closes)
 */
const Session = (() => {
  const KEY = "skillmarket.session";
  const EVENT = "auth:changed";

  const ROLE_LABELS = {
    freelancer: "Freelancer",
    "hire-talent": "Hire talent",
    "super-admin": "Super admin"
  };

  const DASHBOARDS = {
    freelancer: "freelancer-dashboard.html",
    "hire-talent": "hire-talent-dashboard.html",
    "super-admin": "super-admin-dashboard.html"
  };

  const store = (name) => {
    try {
      return window[name];
    } catch (error) {
      return null;
    }
  };

  const read = (storage) => {
    if (!storage) return null;
    try {
      const raw = storage.getItem(KEY);
      if (!raw) return null;
      const user = JSON.parse(raw);
      if (!user || typeof user.email !== "string") return null;
      return user;
    } catch (error) {
      return null;
    }
  };

  const write = (storage, user) => {
    if (!storage) return;
    try {
      storage.setItem(KEY, JSON.stringify(user));
    } catch (error) {
      /* storage unavailable (private mode) — sign-in still works for this page */
    }
  };

  const drop = (storage) => {
    if (!storage) return;
    try {
      storage.removeItem(KEY);
    } catch (error) {
      /* ignore */
    }
  };

  const notify = () => {
    try {
      window.dispatchEvent(new CustomEvent(EVENT));
    } catch (error) {
      /* ignore */
    }
  };

  function get() {
    return read(store("localStorage")) || read(store("sessionStorage"));
  }

  function set(user, remember = false) {
    const record = {
      email: String(user.email || ""),
      name: String(user.name || ""),
      role: String(user.role || "")
    };

    if (remember) {
      drop(store("sessionStorage"));
      write(store("localStorage"), record);
    } else {
      drop(store("localStorage"));
      write(store("sessionStorage"), record);
    }

    notify();
    return record;
  }

  function clear() {
    drop(store("localStorage"));
    drop(store("sessionStorage"));
    notify();
  }

  const roleLabel = (role) => ROLE_LABELS[role] || "Member";

  const dashboardFor = (role) => DASHBOARDS[role] || null;

  const firstName = (user) => String((user && user.name) || "").trim().split(/\s+/)[0] || "";

  function onChange(callback) {
    window.addEventListener(EVENT, callback);
  }

  return { get, set, clear, roleLabel, dashboardFor, firstName, onChange, EVENT };
})();
