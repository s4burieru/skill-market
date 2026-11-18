/**
 * Edit profile page (profile.html).
 *
 * Fills the edit form with the signed-in user's details: the session supplies
 * the identity (name / email), HTML defaults supply realistic demo content and
 * `localStorage["skillmarket.profile.<role>"]` wins when it exists. Saving
 * writes back to that key and patches the session record (Session.update) so
 * the topbar chip and the dashboards agree on the new name without a reload.
 *
 * One form ships per role block; dashboard.js removes the blocks that don't
 * match the signed-in role before this runs, so at most one form exists.
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

  const user = typeof Session !== "undefined" && Session.get();
  if (!user) return; // the session guard in dashboard.js bounces anonymous visitors

  const role = user.role || "freelancer";
  const form = $("[data-profile-form]");
  if (!form) return;

  const STORE_KEY = `skillmarket.profile.${role}`;

  const readSaved = () => {
    try {
      return JSON.parse(window.localStorage.getItem(STORE_KEY) || "{}") || {};
    } catch (error) {
      return {};
    }
  };

  const initials = (name) =>
    String(name || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");

  const saved = readSaved();

  /* --- Hydrate every named field ------------------------------------------ */

  $$("[name]", form).forEach((field) => {
    const key = field.name;
    const fallback =
      key === "fullName" ? user.name : key === "email" ? user.email : field.value;
    const value = saved[key] !== undefined ? String(saved[key]) : String(fallback || "");

    if (field.tagName === "SELECT") {
      const known = $$("option", field).some((option) => option.value === value);
      if (known) field.value = value;
      return;
    }
    field.value = value;
  });

  /* --- Active toggle -------------------------------------------------------- */

  const activeSwitch = $("[data-profile-active]", form);

  const paintActive = (active) => {
    if (activeSwitch) activeSwitch.setAttribute("aria-checked", String(active));
  };

  const savedActive =
    typeof saved.active === "boolean"
      ? saved.active
      : activeSwitch
        ? activeSwitch.getAttribute("aria-checked") === "true"
        : true;
  paintActive(savedActive);

  if (activeSwitch) {
    activeSwitch.addEventListener("click", () => {
      paintActive(activeSwitch.getAttribute("aria-checked") !== "true");
    });
  }

  /* --- Validation ----------------------------------------------------------- */

  const showError = (key, message) => {
    const el = $(`[data-error-for="${key}"]`, form);
    if (!el) return;
    el.textContent = message || "";
    el.hidden = !message;
  };
  const clearErrors = () => ["fullName", "email"].forEach((key) => showError(key, ""));

  form.addEventListener("input", (event) => {
    if (event.target && event.target.name) showError(event.target.name, "");
  });

  /* --- Submit --------------------------------------------------------------- */

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors();

    const data = {};
    $$("[name]", form).forEach((field) => {
      data[field.name] = String(field.value || "").trim();
    });

    let valid = true;
    if (!data.fullName) {
      showError("fullName", "Tell us your name.");
      valid = false;
    }
    if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) {
      showError("email", "Enter a valid email address.");
      valid = false;
    }
    if (!valid) {
      const field = !data.fullName ? $('[name="fullName"]', form) : $('[name="email"]', form);
      if (field) field.focus();
      return;
    }

    data.active = activeSwitch ? activeSwitch.getAttribute("aria-checked") === "true" : true;

    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch (error) {
      /* storage unavailable, the edit still applies to this page visit */
    }

    if (typeof Session.update === "function") {
      Session.update({ name: data.fullName, email: data.email });
    }

    // Keep the topbar chip in sync without a reload.
    const chipName = $(".user-chip__name");
    if (chipName) chipName.textContent = data.fullName;
    const chipAvatar = $(".user-chip__avatar");
    if (chipAvatar) {
      chipAvatar.innerHTML = `<span class="user-chip__initials">${esc(initials(data.fullName))}</span>`;
      chipAvatar.setAttribute("title", data.fullName);
    }

    // Brief button feedback so the save is visible even before the toast.
    const submit = $('[type="submit"]', form);
    if (submit) {
      const label = submit.textContent;
      submit.disabled = true;
      submit.textContent = "Saved";
      window.setTimeout(() => {
        submit.disabled = false;
        submit.textContent = label;
      }, 1600);
    }

    const toast =
      window.DashActions && typeof window.DashActions.toast === "function"
        ? window.DashActions.toast.bind(window.DashActions)
        : null;
    if (toast) toast("Your profile details were saved to this account.", "Profile saved");
  });
})();
