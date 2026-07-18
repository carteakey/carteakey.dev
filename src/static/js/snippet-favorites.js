(() => {
  const STORAGE_KEY = 'carteakey.snippetFavorites.v1'
  const cards = Array.from(document.querySelectorAll('[data-snippet-card]'))
  const searchInput = document.getElementById('snippetSearch')
  const filterButton = document.getElementById('snippetFavoritesFilter')
  const count = document.getElementById('snippetFavoritesCount')
  const emptyState = document.getElementById('snippetEmptyState')
  const status = document.getElementById('snippetFavoriteStatus')

  if (!cards.length || !searchInput || !filterButton) return

  const validIds = new Set(cards.map((card) => card.dataset.snippetId))
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]))
  }

  function syncButtons() {
    for (const button of document.querySelectorAll('[data-snippet-favorite]')) {
      const isFavorite = favorites.has(button.dataset.snippetId)
      button.setAttribute('aria-pressed', String(isFavorite))
      button.classList.toggle('is-favorite', isFavorite)
      button.title = isFavorite ? 'Remove from saved snippets' : 'Save snippet'
    }

    count.textContent = String(favorites.size)
    filterButton.setAttribute('aria-pressed', String(favoritesOnly))
    filterButton.classList.toggle('is-active', favoritesOnly)
  }

  function applyFilters() {
    const term = searchInput.value.trim().toLowerCase()
    const matchingIds = new Set()

    for (const card of cards) {
      const matchesSearch = !term || ['title', 'tags', 'language', 'body']
        .some((key) => (card.dataset[key] || '').includes(term))
      const matchesFavorite = !favoritesOnly || favorites.has(card.dataset.snippetId)
      const visible = matchesSearch && matchesFavorite

      card.classList.toggle('hidden', !visible)
      if (visible) matchingIds.add(card.dataset.snippetId)
    }

    emptyState?.classList.toggle('hidden', matchingIds.size > 0)
  }

  searchInput.addEventListener('input', applyFilters)

  filterButton.addEventListener('click', () => {
    favoritesOnly = !favoritesOnly
    syncButtons()
    applyFilters()
  })

  document.addEventListener('click', (event) => {
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
    syncButtons()
    applyFilters()
  })

  saveFavorites()
  syncButtons()
  applyFilters()
})()
