const source = new URL("./vendor/ascii/alpine-dawn.js", import.meta.url);
source.search = new URL(import.meta.url).search;
const { default: alpineDawn } = await import(source.href);

// On paper, darker samples need more ink: reverse the source's light ramp.
export default function dayDawn() {
  const frame = alpineDawn();
  const ink = { " ": "●", "·": "•", "•": "·", "●": " " };
  return (seconds, options = {}) =>
    frame(seconds, { ...options, daylight: true }).replace(
      /[ ·•●]/g,
      (dot) => ink[dot],
    );
}
