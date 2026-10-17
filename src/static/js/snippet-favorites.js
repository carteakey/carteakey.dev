// Saved snippets: bookmark buttons on snippet rows plus the "Saved" toolbar
// filter. Filtering goes through the collection engine (collection-index.js)
// so search and Saved combine in one pass.
(() => {
  const STORAGE_KEY = 'carteakey.snippetFavorites.v1'
  const filterButton = document.querySelector('[data-collection-saved]')
  const root = filterButton?.closest('[data-collection-index]')
  if (!root?.collectionFilters) return

  const count = root.querySelector('[data-collection-saved-count]')
  const buttons = Array.from(root.querySelectorAll('[data-snippet-favorite]'))
  const validIds = new Set(buttons.map((button) => button.dataset.snippetId))
  const status = document.createElement('p')
  status.className = 'sr-only'
  status.setAttribute('aria-live', 'polite')
  root.append(status)

  let favoritesOnly = false
  let favorites = loadFavorites()

  function loadFavorites() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      if (!Array.isArray(saved)) return new Set()
      return new Set(saved.filter((id) => validIds.has(id)))
    } catch {
      return new Set()
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]))
    } catch {}
  }

  function sync() {
    for (const button of buttons) {
      const isFavorite = favorites.has(button.dataset.snippetId)
      button.setAttribute('aria-pressed', String(isFavorite))
      button.classList.toggle('is-favorite', isFavorite)
      button.title = isFavorite ? 'Remove from saved snippets' : 'Save snippet'
    }

    count.textContent = String(favorites.size)
    filterButton.setAttribute('aria-pressed', String(favoritesOnly))
    filterButton.classList.toggle('is-active', favoritesOnly)

    root.collectionFilters.set(
      'saved',
      favoritesOnly
        ? (item) => favorites.has(item.querySelector('[data-snippet-favorite]')?.dataset.snippetId)
        : null,
    )
  }

  filterButton.addEventListener('click', () => {
    favoritesOnly = !favoritesOnly
    sync()
  })

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-snippet-favorite]')
    if (!button) return

    const id = button.dataset.snippetId
    const title = button.dataset.snippetTitle

    if (favorites.has(id)) {
      favorites.delete(id)
      status.textContent = `${title} removed from saved snippets.`
    } else {
      favorites.add(id)
      status.textContent = `${title} saved.`
    }

    saveFavorites()
    sync()
  })

  saveFavorites()
  sync()
})()
