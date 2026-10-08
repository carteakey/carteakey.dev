import { playAscii } from "./ascii-player.js";

playAscii(document.querySelector("[data-ascii-coast]"), async () => {
  const { default: nightCoast } = await import("./vendor/ascii/night-coast.js");
  return nightCoast();
});

playAscii(document.querySelector("[data-ascii-dawn]"), async () => {
  const { default: dayDawn } = await import("./ascii-day.js");
  return dayDawn();
});
