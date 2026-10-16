// Authorship Filter - page-local AI content toggle
// Modes: "all" (everything) | "no-generated" (human + AI-assisted) | "human-only" (no AI)
// Applies a data-ai-filter attribute on <html> for the current page only.

const AI_FILTERS = ["all", "no-generated", "human-only"];
let currentAiFilter = "all";

try {
  localStorage.removeItem("aiFilter");
} catch {
  // ignore storage errors
}

const getAiFilter = () => currentAiFilter;

const applyAiFilter = (value) => {
  document.documentElement.dataset.aiFilter = value;
};

applyAiFilter("all");

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

  const hidden = Array.from(document.querySelectorAll("[data-authored-by]")).filter(
    (el) => !window.aiFilterAllows(el.dataset.authoredBy) && el.offsetParent === null
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
  if (!AI_FILTERS.includes(value) || value === currentAiFilter) return;
  currentAiFilter = value;
  applyAiFilter(value);
  document.dispatchEvent(new CustomEvent("aifilterchange", { detail: { filter: value } }));
  updateAiFilterNotice();
};

window.setAiFilter = setAiFilter;

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", (event) => {
    const option = event.target.closest("[data-ai-filter-option]");
    if (option) setAiFilter(option.dataset.aiFilterOption);
  });
});

document.addEventListener("aifilterchange", updateAiFilterNotice);
