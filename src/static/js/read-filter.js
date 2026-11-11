// Read progress on /blog/: All / Unread / Read toolbar filter plus a count.
// Shares storage with the per-post "Mark as read" button (learning-progress.js),
// so progress from the old Reading Tracker carries over. Filtering goes through
// the collection engine (collection-index.js) so it combines with search.
(() => {
  const STORAGE_KEY = 'carteakey.learningProgress.v1'
  const group = document.querySelector('[data-collection-read]')
  const root = group?.closest('[data-collection-index]')
  if (!root?.collectionFilters) return

  const buttons = Array.from(group.querySelectorAll('[data-read-filter]'))
  const count = root.querySelector('[data-collection-read-count]')
  const items = Array.from(root.querySelectorAll('[data-collection-item][data-url]'))
  const urls = new Set(items.map((item) => item.dataset.url))

  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }

  const progress = load()
  const isRead = (url) => Boolean(progress[url]?.completedAt)

  for (const item of items) item.classList.toggle('is-read', isRead(item.dataset.url))
  if (count) count.textContent = `${[...urls].filter(isRead).length}/${urls.size} read`

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const mode = button.dataset.readFilter
      for (const other of buttons) {
        other.setAttribute('aria-pressed', String(other === button))
        other.classList.toggle('is-active', other === button)
      }
      root.collectionFilters.set(
        'read',
        mode === 'all' ? null : (item) => (mode === 'read') === isRead(item.dataset.url),
      )
    })
  }
})()
