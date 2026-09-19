function collectionView(storageKey, defaultView, allowedViews) {
  const availableViews = Array.isArray(allowedViews) && allowedViews.length
    ? allowedViews
    : [defaultView];
  const storedView = localStorage.getItem(storageKey);

  return {
    view: availableViews.includes(storedView) ? storedView : defaultView,
    init() {
      this.$watch("view", (value) => {
        localStorage.setItem(storageKey, value);
        this.$nextTick(() => {
          this.$root.querySelectorAll("[data-feed-masonry]").forEach((grid) => {
            grid.dispatchEvent(new CustomEvent("feed:layout"));
          });
        });
      });
    },
  };
}
