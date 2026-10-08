import { playAscii } from "./ascii-player.js";

playAscii(document.querySelector("[data-ascii-coast]"), async () => {
  const { default: nightCoast } = await import("./vendor/ascii/night-coast.js");
  return nightCoast();
});
