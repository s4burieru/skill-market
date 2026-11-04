(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const eye = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>`;

  const eyeOff = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M3 3l18 18"></path>
    <path d="M10.6 6.3A10.4 10.4 0 0 1 12 6.2c6.4 0 10 5.8 10 5.8a18.5 18.5 0 0 1-3.5 4.1"></path>
    <path d="M6.4 8A17.4 17.4 0 0 0 2 12s3.6 5.8 10 5.8a10.2 10.2 0 0 0 3.9-.8"></path>
    <path d="M9.9 10.1a3 3 0 0 0 4.2 4.2"></path>
  </svg>`;

  const levels = [
    { label: "", width: "0%", color: "var(--danger)" },
    { label: "Weak password", width: "25%", color: "#dc2626" },
    { label: "Fair password", width: "50%", color: "#f59e0b" },
    { label: "Good password", width: "75%", color: "var(--green-500)" },
    { label: "Strong password", width: "100%", color: "var(--green-600)" }
  ];

  const esc = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const showNotice = (message) => {
    const notice = $("#notice");
    if (!notice) return;
    notice.innerHTML = message;
    notice.removeAttribute("hidden");
  };

  const setError = (form, name, message) => {
    $$(`[name="${name}"]`, form).forEach((control) => {
      if (message) control.setAttribute("aria-invalid", "true");
      else control.removeAttribute("aria-invalid");
    });

    const error = form.querySelector(`[data-error-for="${name}"]`);
    if (error) {
      error.textContent = message;
      error.hidden = !message;
    }

    const terms = form.querySelector("[data-terms]");
    if (name === "terms" && terms) terms.dataset.invalid = message ? "true" : "false";
  };

  const focusFirstInvalid = (form) => {
    const control = form.querySelector('[aria-invalid="true"]');
    if (control) control.focus();
  };

  const valuesOf = (form) => {
    const data = new FormData(form);
    const values = {};
    data.forEach((value, key) => {
      values[key] = typeof value === "string" ? value.trim() : value;
    });
    return values;
  };

  const validEmail = (value) => EMAIL.test(String(value || "").trim());

  function wirePasswordToggles() {
    $$("[data-toggle-password]").forEach((toggle) => {
      const input = toggle.parentElement.querySelector("input");
      if (!input) return;

      toggle.addEventListener("click", () => {
        const visible = input.type === "text";
        input.type = visible ? "password" : "text";
        toggle.innerHTML = visible ? eye : eyeOff;
        toggle.setAttribute("aria-label", visible ? "Show password" : "Hide password");
        input.focus();
      });
    });
  }

  function scorePassword(value) {
    let score = 0;
    if (value.length >= 8) score += 1;
    if (value.length >= 12) score += 1;
    if (/[a-z]/i.test(value) && /\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return score;
  }

  function wireStrength() {
    const meter = $("[data-strength]");
    const input = $("#join-password");
    if (!meter || !input) return;

    const fill = $("[data-strength-fill]", meter);
    const label = $("[data-strength-label]", meter);

    input.addEventListener("input", () => {
      const value = input.value;
      if (!value) {
        meter.hidden = true;
        return;
      }

      const level = levels[Math.min(scorePassword(value), levels.length - 1)];
      meter.hidden = false;
      fill.style.width = level.width;
      fill.style.background = level.color;
      label.textContent = level.label;
      label.style.color = level.color;
    });
  }

  function wireLinkRewrite() {
    const point = () => {
      $$('a[href^="#"]').forEach((link) => {
        const hash = link.getAttribute("href");
        if (hash.length < 2) return;

        let target = null;
        try {
          target = document.querySelector(hash);
        } catch (error) {
          target = null;
        }
        if (!target) link.setAttribute("href", `index.html${hash}`);
      });
    };

    point();
    new MutationObserver(point).observe(document.body, { childList: true, subtree: true });
  }

  function submitLogin(form) {
    const values = valuesOf(form);
    const emailOk = validEmail(values.email);
    const passwordOk = String(values.password || "").length >= 6;

    setError(form, "email", emailOk ? "" : "Enter a valid email address.");
    setError(
      form,
      "password",
      passwordOk ? "" : "Password must be at least 6 characters."
    );

    if (!emailOk || !passwordOk) {
      focusFirstInvalid(form);
      return;
    }

    const handle = String(values.email).split("@")[0];
    const remember = form.querySelector('[name="remember"]').checked;
    showNotice(
      `<strong>Welcome back, ${esc(handle)}!</strong><br>
       ${remember ? "You will stay signed in on this device." : "Your session is active for this visit."}`
    );
    form.reset();
  }

  function submitJoin(form) {
    const values = valuesOf(form);
    const typeOk = Boolean(values.accountType);
    const nameOk = String(values.name || "").length >= 2;
    const emailOk = validEmail(values.email);
    const raw = String(values.password || "");
    const passwordOk = raw.length >= 8 && /[a-z]/i.test(raw) && /\d/.test(raw);
    const termsOk = Boolean(values.terms);

    setError(form, "accountType", typeOk ? "" : "Choose an account type to continue.");
    setError(form, "name", nameOk ? "" : "Please enter your full name.");
    setError(form, "email", emailOk ? "" : "Enter a valid email address.");
    setError(
      form,
      "password",
      passwordOk ? "" : "Use at least 8 characters with a letter and a number."
    );
    setError(form, "terms", termsOk ? "" : "Please accept the terms to continue.");

    if (!typeOk || !nameOk || !emailOk || !passwordOk || !termsOk) {
      focusFirstInvalid(form);
      return;
    }

    const firstName = String(values.name).split(/\s+/)[0];
    const label = values.accountType === "freelancer" ? "Freelancer" : "Hire talent";
    showNotice(
      `<strong>Account created!</strong><br>
       Welcome to SkillMarket, ${esc(firstName)}. Your ${label.toLowerCase()} account is ready.`
    );
    form.reset();

    const meter = $("[data-strength]");
    if (meter) meter.hidden = true;
  }

  function wireForm() {
    const form = $("[data-form]");
    if (!form) return;

    const type = form.dataset.form;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (type === "login") submitLogin(form);
      else submitJoin(form);
    });

    form.addEventListener("input", (event) => {
      const name = event.target.name;
      if (name && form.querySelector(`[data-error-for="${name}"]`)) setError(form, name, "");
    });

    form.addEventListener("change", (event) => {
      const name = event.target.name;
      if (name && form.querySelector(`[data-error-for="${name}"]`)) setError(form, name, "");
    });
  }

  wireLinkRewrite();
  wirePasswordToggles();
  wireStrength();
  wireForm();
})();
