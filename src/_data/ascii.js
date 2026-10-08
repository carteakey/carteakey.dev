import nightCoast from "../static/js/vendor/ascii/night-coast.js";

// Render the first frame during the build so the footer also works without JS.
export default {
  coast: nightCoast()(0),
};
