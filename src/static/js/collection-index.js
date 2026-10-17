// Collection engine filters (components/collection-index.njk).
// Search, type facets and page filters (e.g. Saved snippets) register a
// predicate on the collection root; one pass applies them all, hides empty
// group headings, and shows the empty state. The authorship filter stays in
// CSS (ai-filter.js) and is independent of this pass.

(() => {
  const initCollection = (root) => {
    const items = Array.from(root.querySelectorAll("[data-collection-item]"));
    const predicates = new Map();

    const apply = () => {
      const tests = [...predicates.values()];
      for (const item of items) {
        item.toggleAttribute("data-filtered-out", !tests.every((test) => test(item)));
      }

      for (const group of root.querySelectorAll("[data-collection-group]")) {
        const heading = group.previousElementSibling;
        if (!heading?.matches("[data-collection-group-heading]")) continue;
        const empty = !group.querySelector("[data-collection-item]:not([data-filtered-out])");
        heading.hidden = empty;
        group.hidden = empty;
      }

      const visible = items.some(
        (item) => !item.hasAttribute("data-filtered-out") && item.parentElement?.closest("[data-collection-view]")?.getClientRects().length,
      );
      const empty = root.querySelector("[data-collection-empty]");
      if (empty) empty.hidden = visible || !tests.length;

      root.querySelectorAll("[data-feed-masonry]").forEach((grid) => grid.dispatchEvent(new CustomEvent("feed:layout")));
    };

    root.collectionFilters = {
      set(name, test) {
        if (test) predicates.set(name, test);
        else predicates.delete(name);
        apply();
      },
      apply,
    };

    const search = root.querySelector("[data-collection-search]");
    search?.addEventListener("input", () => {
      const term = search.value.trim().toLowerCase();
      root.collectionFilters.set("search", term ? (item) => (item.dataset.search || "").includes(term) : null);
    });

    const facets = Array.from(root.querySelectorAll("[data-collection-facet]"));
    for (const facet of facets) {
      facet.addEventListener("click", () => {
        const type = facet.dataset.collectionFacet;
        for (const other of facets) {
          const active = other === facet;
          other.classList.toggle("active", active);
          other.setAttribute("aria-pressed", String(active));
        }
        root.collectionFilters.set("type", type ? (item) => item.dataset.type === type : null);
      });
    }

    // Switching views changes which copy is on screen; recount the empty state.
    root.addEventListener("click", (event) => {
      if (event.target.closest(".view-toggle button")) requestAnimationFrame(apply);
    });

    root.dispatchEvent(new CustomEvent("collection:ready", { bubbles: true }));
  };

  document.querySelectorAll("[data-collection-index]").forEach(initCollection);
})();
