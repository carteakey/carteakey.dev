// Authorship Filter - reader-controlled AI content toggle
// Modes: "all" (everything) | "no-generated" (human + AI-assisted) | "human-only" (no AI)
// Applies a data-ai-filter attribute on <html>; CSS in tailwind.css hides
// [data-authored-by] items inside a [data-ai-filter-scope] (the pages that show
// the filter control), so nothing disappears on pages without one.

const AI_FILTER_KEY = "aiFilter";
const AI_FILTERS = ["all", "no-generated", "human-only"];

const getAiFilter = () => {
  const value = localStorage[AI_FILTER_KEY];
  return AI_FILTERS.includes(value) ? value : "all";
};

const applyAiFilter = (value) => {
  document.documentElement.dataset.aiFilter = value;
};

// Apply saved filter immediately to prevent filtered content flashing in
applyAiFilter(getAiFilter());

// Anything that is not explicitly "ai-*" is treated as human/unclassified
window.aiFilterAllows = (author) => {
  const filter = getAiFilter();
  if (filter === "all") return true;
  if (filter === "no-generated") return author !== "ai-generated";
  return !(typeof author === "string" && author.startsWith("ai-"));
};

window.getAiFilter = getAiFilter;

const updateAiFilterNotice = () => {
  const existing = document.getElementById("aiFilterNotice");
  if (existing) existing.remove();

  const filter = getAiFilter();
  if (filter === "all") return;

  const hidden = Array.from(document.querySelectorAll("[data-ai-filter-scope] [data-authored-by]")).filter(
    // Count only items in the view on screen; inactive list/grid copies have a hidden parent.
    (el) => !window.aiFilterAllows(el.dataset.authoredBy) && el.parentElement?.getClientRects().length > 0
  ).length;
  if (!hidden) return;

  const notice = document.createElement("div");
  notice.id = "aiFilterNotice";
  notice.className = "ai-filter-notice";
  notice.setAttribute("role", "status");
  notice.textContent =
    hidden === 1 ? "1 item hidden by authorship filter" : `${hidden} items hidden by authorship filter`;
  document.body.appendChild(notice);
};

const setAiFilter = (value) => {
  if (!AI_FILTERS.includes(value) || value === getAiFilter()) return;
  localStorage[AI_FILTER_KEY] = value;
  applyAiFilter(value);
  document.dispatchEvent(new CustomEvent("aifilterchange", { detail: { filter: value } }));
  updateAiFilterNotice();
};

window.setAiFilter = setAiFilter;

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", (event) => {
    const option = event.target.closest("[data-ai-filter-group] [data-ai-filter-option]");
    if (option) setAiFilter(option.dataset.aiFilterOption);
  });
  updateAiFilterNotice();
});

document.addEventListener("aifilterchange", updateAiFilterNotice);
