// Mount every [data-halftone] scene on the page. Imports carry this entry's
// release query so the year-long asset cache never serves a stale scene.
const release = new URL(import.meta.url).search;
const load = (path) => import(new URL(path + release, import.meta.url).href);

const SCENES = {
  coast: { module: "./footer-scene.js", cols: 300, still: 4.2 },
  bonfire: { module: "./scenes/bonfire.js", cols: 72, still: 1.3 },
  coffee: { module: "./scenes/coffee.js", cols: 60, still: 2 },
  vinyl: { module: "./scenes/vinyl.js", cols: 72, still: 0.4 },
  bottle: { module: "./scenes/bottle.js", cols: 64, still: 1.5 },
  moon: { module: "./scenes/moon.js", cols: 72, still: 0 },
  projector: { module: "./scenes/projector.js", cols: 72, still: 1.5 },
};

const shells = document.querySelectorAll("[data-halftone]");
if (shells.length) {
  const [{ mountHalftone }, { seasonFor }] = await Promise.all([
    load("./halftone.js"),
    load("./halftone-kit.js"),
  ]);
  // ?season=winter previews another season; otherwise Toronto's calendar decides.
  const preview = new URLSearchParams(location.search).get("season");
  const season = ["winter", "spring", "summer", "autumn"].includes(preview)
    ? preview
    : seasonFor();

  for (const shell of shells) {
    const spec = SCENES[shell.dataset.halftone];
    if (!spec) continue;
    load(spec.module)
      .then(({ default: makeScene, describe }) => {
        // A scene that can describe itself refreshes its caption live.
        if (describe)
          document
            .querySelectorAll(
              `[data-halftone-caption="${shell.dataset.halftone}"]`,
            )
            .forEach((el) => (el.textContent = describe(new Date())));
        mountHalftone(shell, makeScene, {
          cols: spec.cols,
          still: spec.still,
          options: { season, mode: shell.dataset.halftoneMode },
        });
      })
      .catch(() => {}); // the build-time still stays in place
  }
}
