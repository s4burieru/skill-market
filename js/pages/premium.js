/**
 * Premium & Verification page: plan pickers, application form validation and
 * the "application received" state. Fully static, nothing leaves the browser;
 * applications are appended to localStorage under `skillmarket.premium.applications`.
 */
(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const form = $("#premium-form");
  const success = $("#premium-success");
  const errorBox = $("#premium-error");
  const refTarget = $("#premium-ref");

  /* --- Plan pre-selection (hero/plan buttons + ?plan= param) ------------- */

  function selectPlan(plan) {
    const input = form
      ? form.querySelector(`input[name="plan"][value="${plan}"]`)
      : null;
    if (input) input.checked = true;
  }

  $$("[data-plan-choose]").forEach((button) => {
    button.addEventListener("click", () => {
      selectPlan(button.dataset.planChoose);
      const apply = $("#apply");
      if (apply) apply.scrollIntoView({ behavior: "smooth", block: "start" });
      if (form) {
        form.classList.remove("pm-form--flash");
        // Re-trigger the flash animation on every click.
        void form.offsetWidth;
        form.classList.add("pm-form--flash");
      }
    });
  });

  const planParam = new URLSearchParams(location.search).get("plan");
  if (planParam === "premium" || planParam === "verified") selectPlan(planParam);

  /* --- Form validation ---------------------------------------------------- */

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setFieldState(input, valid) {
    input.setAttribute("aria-invalid", valid ? "false" : "true");
    const error = form.querySelector(`[data-error="${input.name}"]`);
    if (error) error.hidden = valid;
    return valid;
  }

  function validUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  function validate() {
    const problems = [];
    const name = form.elements.name;
    const email = form.elements.email;
    const role = form.elements.role;
    const portfolio = form.elements.portfolio;
    const consent = form.elements.consent;

    if (!setFieldState(name, name.value.trim().length >= 2)) {
      problems.push("your full name");
    }
    if (!setFieldState(email, EMAIL_RE.test(email.value.trim()))) {
      problems.push("a valid email address");
    }
    if (!setFieldState(role, role.value !== "")) {
      problems.push("what you do");
    }
    const portfolioOk =
      portfolio.value.trim() === "" || validUrl(portfolio.value.trim());
    if (!setFieldState(portfolio, portfolioOk)) {
      problems.push("a valid portfolio URL (or leave it empty)");
    }
    const consentOk = consent.checked;
    const consentError = form.querySelector('[data-error="consent"]');
    if (consentError) consentError.hidden = consentOk;
    if (!consentOk) problems.push("your consent to the ID check");

    return problems;
  }

  function generateReference() {
    const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i += 1) {
      code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return `SKM-${code}`;
  }

  function persist(application) {
    try {
      const key = "skillmarket.premium.applications";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.push(application);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      // Storage can be unavailable (private mode); the UX still works.
      console.warn("Could not persist application", error);
    }
  }

  if (form) {
    // Clear the invalid state as the person fixes each field.
    form.addEventListener("input", (event) => {
      const target = event.target;
      if (target.matches("input, select")) {
        target.removeAttribute("aria-invalid");
        const error = form.querySelector(`[data-error="${target.name}"]`);
        if (error) error.hidden = true;
      }
      if (errorBox) errorBox.hidden = true;
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const problems = validate();

      if (problems.length) {
        if (errorBox) {
          errorBox.textContent = `Almost, please double-check ${problems.join(", ")}.`;
          errorBox.hidden = false;
          errorBox.focus?.();
        }
        const firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const application = {
        ref: generateReference(),
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        role: form.elements.role.value,
        portfolio: form.elements.portfolio.value.trim() || null,
        plan: form.elements.plan.value,
        submittedAt: new Date().toISOString()
      };

      persist(application);

      if (refTarget) refTarget.textContent = application.ref;
      form.hidden = true;
      if (success) {
        success.hidden = false;
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }
})();
