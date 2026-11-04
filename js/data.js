const Data = (() => {
  const cache = new Map();

  const snapshot = () => window.__SKILL_MARKET_DATA__;

  async function load(name) {
    if (location.protocol === "file:") {
      const bundled = snapshot();
      if (bundled && name in bundled) return bundled[name];
      throw new Error(
        `data/${name}.json is not in js/data-bundle.js — run "npm run build:data" and reload.`
      );
    }

    try {
      const res = await fetch(`data/${name}.json`);
      if (!res.ok) throw new Error(`Failed to load data/${name}.json (${res.status})`);
      return await res.json();
    } catch (error) {
      const bundled = snapshot();
      if (bundled && name in bundled) {
        console.warn(`Could not fetch data/${name}.json — using js/data-bundle.js snapshot.`, error);
        return bundled[name];
      }
      throw error;
    }
  }

  function get(name) {
    if (cache.has(name)) return cache.get(name);

    const request = load(name).catch((err) => {
      cache.delete(name);
      throw err;
    });

    cache.set(name, request);
    return request;
  }

  function getAll(names) {
    return Promise.all(names.map((n) => get(n)));
  }

  return { get, getAll };
})();
