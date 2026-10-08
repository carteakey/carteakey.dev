// The scene is self-hosted; the server-rendered frame remains if loading fails.
const scene = document.querySelector("[data-ascii-coast]");
const motion = matchMedia("(prefers-reduced-motion: reduce)");

if (scene && "IntersectionObserver" in window) {
  let visible = false;
  let frame;
  let timer;
  let loading;
  let elapsed = 0;
  const firstFrame = scene.textContent;

  function pause() {
    clearTimeout(timer);
    timer = undefined;
  }

  function tick() {
    timer = undefined;
    if (!visible || document.hidden || motion.matches || !frame) return;
    scene.textContent = frame(elapsed);
    elapsed += 1 / 8;
    timer = setTimeout(tick, 125);
  }

  async function update() {
    pause();
    if (motion.matches) scene.textContent = firstFrame;
    if (!visible || document.hidden || motion.matches) return;
    try {
      loading ??= import("./vendor/ascii/night-coast.js");
      const { default: nightCoast } = await loading;
      frame ??= nightCoast();
      // Visibility can change while the module loads.
      pause();
      tick();
    } catch {
      // Keep the build-time frame if the module cannot be fetched.
    }
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    void update();
  });
  observer.observe(scene);
  document.addEventListener("visibilitychange", update);
  motion.addEventListener("change", update);
  window.addEventListener("pagehide", pause);
}
