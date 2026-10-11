import { moonPhase } from "../static/js/scenes/moon.js";

// Tonight's moon at build time; the page refreshes it live in the browser.
export default function () {
  const { name, illumination } = moonPhase(new Date());
  return {
    name,
    percent: Math.round(illumination * 100),
    caption: `Tonight in Toronto: ${name}, ${Math.round(illumination * 100)}% lit`,
  };
}
