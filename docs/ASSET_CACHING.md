# Asset Caching Decision

The site uses the manually maintained release version from `versions.json` as the cache key for first-party CSS and JavaScript. Generated pages request assets such as `/css/tailwind.css?v=2.5.1`.

This is intentionally not a build timestamp:

- unchanged deploys keep reusing the same browser cache;
- a release bump invalidates every referenced first-party asset together;
- URLs remain deterministic and reproducible;
- the existing manual version workflow remains the single cache-invalidation control.

Netlify serves versioned CSS and JavaScript with a one-year immutable cache lifetime. The service worker itself is explicitly served with `no-cache` so browsers continue checking it for updates.

When changing a first-party CSS or JavaScript asset, bump `versions.json` as required by the release checklist. No filename hashing pipeline is needed unless the site later moves away from manual versions.
