/**
 * Play a pure frame(timeInSeconds) -> string function in a pre element.
 * Keep the build-time frame when animation is unavailable or not desired.
 */
export function playAscii(
  element,
  loadFrame,
  {
    fps = 8,
    renderFrame = (text) => {
      element.textContent = text;
    },
    renderStatic = false,
  } = {},
) {
  if (!element || !("IntersectionObserver" in window)) return () => {};

  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const firstFrame = element.textContent;
  const interval = 1000 / Math.max(1, Math.min(15, fps));
  let visible = false;
  let frame;
  let loading;
  let timer;
  let elapsed = 0;
  let stopped = false;

  function pause() {
    clearTimeout(timer);
    timer = undefined;
  }

  function tick() {
    timer = undefined;
    if (stopped || !visible || document.hidden || motion.matches || !frame)
      return;
    renderFrame(frame(elapsed));
    elapsed += interval / 1000;
    timer = setTimeout(tick, interval);
  }

  async function update() {
    pause();
    if (motion.matches && !renderStatic) renderFrame(firstFrame);
    if (
      stopped ||
      !visible ||
      document.hidden ||
      (motion.matches && !renderStatic)
    )
      return;
    try {
      loading ??= Promise.resolve().then(loadFrame);
      frame = await loading;
      // Loading can finish after visibility or motion preferences have changed.
      pause();
      if (stopped || !visible || document.hidden) return;
      if (motion.matches) renderFrame(frame(0));
      else tick();
    } catch {
      // Leave the first frame intact when loading is unavailable.
    }
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    void update();
  });
  observer.observe(element);
  document.addEventListener("visibilitychange", update);
  motion.addEventListener("change", update);
  window.addEventListener("pagehide", pause);
  window.addEventListener("pageshow", update);

  return () => {
    stopped = true;
    pause();
    observer.disconnect();
    document.removeEventListener("visibilitychange", update);
    motion.removeEventListener("change", update);
    window.removeEventListener("pagehide", pause);
    window.removeEventListener("pageshow", update);
  };
}
