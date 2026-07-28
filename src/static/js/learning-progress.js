(() => {
  const STORAGE_KEY = 'carteakey.learningProgress.v1'
  const toggles = Array.from(document.querySelectorAll('[data-learning-toggle]'))
  const items = Array.from(document.querySelectorAll('[data-learning-item]'))
  const filterButtons = Array.from(document.querySelectorAll('[data-learning-filter]'))
  const searchInput = document.getElementById('learningSearch')
  const completedCount = document.getElementById('learningCompletedCount')
  const totalCount = document.getElementById('learningTotalCount')
  const progressBar = document.getElementById('learningProgressBar')
  const progressText = document.getElementById('learningProgressText')
  const emptyState = document.getElementById('learningEmptyState')
  const liveStatus = document.getElementById('learningLiveStatus')

  if (!toggles.length) return

  let progress = loadProgress()
  let activeFilter = 'all'

  function loadProgress() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }

  function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }

  function isComplete(id) {
    return Boolean(progress[id]?.completedAt)
  }

  function syncToggles() {
    for (const button of toggles) {
      const complete = isComplete(button.dataset.learningId)
      button.setAttribute('aria-pressed', String(complete))
      button.classList.toggle('is-complete', complete)

      const label = button.querySelector('[data-learning-label]')
      if (label) label.textContent = complete ? 'Learned' : 'Mark as learned'

      const state = button.closest('[data-learning-item], [data-learning-panel]')?.querySelector('[data-learning-state]')
      if (state) state.textContent = complete ? 'Completed' : 'To learn'
    }
  }

  function syncDashboard() {
    if (!items.length) return

    const knownIds = new Set(items.map((item) => item.dataset.learningId))
    const completed = [...knownIds].filter(isComplete).length
    const total = knownIds.size
    const percentage = total ? Math.round((completed / total) * 100) : 0

    if (completedCount) completedCount.textContent = String(completed)
    if (totalCount) totalCount.textContent = String(total)
    if (progressBar) progressBar.style.width = `${percentage}%`
    if (progressText) progressText.textContent = `${percentage}% complete`

    applyDashboardFilters()
  }

  function applyDashboardFilters() {
    if (!items.length) return

    const term = searchInput?.value.trim().toLowerCase() || ''
    let visibleCount = 0

    for (const item of items) {
      const complete = isComplete(item.dataset.learningId)
      const matchesFilter = activeFilter === 'all'
        || (activeFilter === 'complete' && complete)
        || (activeFilter === 'open' && !complete)
      const matchesSearch = !term || (item.dataset.learningSearch || '').includes(term)
      const visible = matchesFilter && matchesSearch

      item.classList.toggle('hidden', !visible)
      if (visible) visibleCount += 1
    }

    emptyState?.classList.toggle('hidden', visibleCount > 0)
  }

  for (const button of toggles) {
    button.addEventListener('click', () => {
      const id = button.dataset.learningId
      const title = button.dataset.learningTitle || id

      if (isComplete(id)) {
        delete progress[id]
        if (liveStatus) liveStatus.textContent = `${title} moved back to the learning queue.`
      } else {
        progress[id] = {
          completedAt: new Date().toISOString(),
          title,
        }
        if (liveStatus) liveStatus.textContent = `${title} marked as learned.`
      }

      saveProgress()
      syncToggles()
      syncDashboard()
    })
  }

  for (const button of filterButtons) {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.learningFilter
      for (const candidate of filterButtons) {
        const active = candidate === button
        candidate.setAttribute('aria-pressed', String(active))
        candidate.classList.toggle('is-active', active)
      }
      applyDashboardFilters()
    })
  }

  searchInput?.addEventListener('input', applyDashboardFilters)

  syncToggles()
  syncDashboard()
})()
