/* Become a freelancer: fills the shared CTA band at the bottom of the page. */
(() => {
  Data.get("site")
    .then((site) => {
      const host = document.querySelector("[data-cta]");
      if (host && site.cta) host.innerHTML = Components.Cta(site.cta);
    })
    .catch((error) => console.error(error));
})();
