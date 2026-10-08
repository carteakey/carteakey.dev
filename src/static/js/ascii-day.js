import alpineDawn from "./vendor/ascii/alpine-dawn.js";

// On paper, darker samples need more ink: reverse the source's light ramp.
export default function dayDawn() {
  const frame = alpineDawn();
  const ink = { " ": "●", "·": "•", "•": "·", "●": " " };
  return (seconds) => frame(seconds).replace(/[ ·•●]/g, (dot) => ink[dot]);
}
