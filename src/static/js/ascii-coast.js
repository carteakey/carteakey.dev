// Propagate the entry script's release query through the complete module graph.
// These URLs previously had a year-long immutable cache without versioning.
const release = new URL(import.meta.url).search;
const loadModule = (path) =>
  import(new URL(path + release, import.meta.url).href);
const [{ playAscii }, { makeHalftoneRenderer }] = await Promise.all([
  loadModule("./ascii-player.js"),
  loadModule("./ascii-halftone.js"),
]);

function playLandscape(selector, theme, loadScene) {
  const element = document.querySelector(selector);
  if (!element) return;
  const paint = makeHalftoneRenderer(element, theme);
  if (!paint) {
    playAscii(element, async () => (await loadScene())());
    return;
  }
  playAscii(
    element,
    async () => {
      const makeScene = await loadScene();
      const scene = makeScene();
      const density = new Float32Array(200 * 100);
      return (seconds) => {
        scene(seconds, { density });
        return { density, cols: 200, rows: 100 };
      };
    },
    { fps: 15, renderFrame: paint, renderStatic: true },
  );
}

playLandscape("[data-ascii-coast]", "night", async () => {
  const { default: nightCoast } = await loadModule(
    "./vendor/ascii/night-coast.js",
  );
  return nightCoast;
});

playLandscape("[data-ascii-dawn]", "day", async () => {
  const { default: dayDawn } = await loadModule("./ascii-day.js");
  return dayDawn;
});
