import nightCoast from "../static/js/vendor/ascii/night-coast.js";
import dayDawn from "../static/js/ascii-day.js";

// Build both fallbacks so theme selection also works without animation.
export default {
  coast: nightCoast()(0),
  dawn: dayDawn()(0),
};
