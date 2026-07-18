(() => {
  const script = document.currentScript
  const sampleRate = Number(script?.dataset.sampleRate ?? 0.1)
  const endpoint = script?.dataset.endpoint || '/.netlify/functions/web-vitals'
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)

  if (isLocal || !('PerformanceObserver' in window) || Math.random() >= sampleRate) return

  const metrics = new Map()
  let sent = false

  function rating(name, value) {
    const thresholds = {
      LCP: [2500, 4000],
      CLS: [0.1, 0.25],
      INP: [200, 500],
    }[name]

    if (value <= thresholds[0]) return 'good'
    if (value <= thresholds[1]) return 'needs-improvement'
    return 'poor'
  }

  function observe(type, callback, options = {}) {
    try {
      const observer = new PerformanceObserver((list) => callback(list.getEntries()))
      observer.observe({ type, buffered: true, ...options })
      return observer
    } catch {
      return null
    }
  }

  observe('largest-contentful-paint', (entries) => {
    const entry = entries.at(-1)
    if (entry) metrics.set('LCP', entry.startTime)
  })

  let clsValue = 0
  let clsWindowValue = 0
  let clsWindowStart = 0
  let clsWindowEnd = 0

  observe('layout-shift', (entries) => {
    for (const entry of entries) {
      if (entry.hadRecentInput) continue

      if (entry.startTime - clsWindowEnd > 1000 || entry.startTime - clsWindowStart > 5000) {
        clsWindowValue = entry.value
        clsWindowStart = entry.startTime
      } else {
        clsWindowValue += entry.value
      }

      clsWindowEnd = entry.startTime
      clsValue = Math.max(clsValue, clsWindowValue)
      metrics.set('CLS', clsValue)
    }
  })

  let longestInteraction = 0
  observe('event', (entries) => {
    for (const entry of entries) {
      if (entry.interactionId && entry.duration > longestInteraction) {
        longestInteraction = entry.duration
        metrics.set('INP', longestInteraction)
      }
    }
  }, { durationThreshold: 40 })

  function send() {
    if (sent || !metrics.size) return
    sent = true

    for (const [name, value] of metrics) {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          value: Number(value.toFixed(name === 'CLS' ? 4 : 0)),
          rating: rating(name, value),
          route: window.location.pathname,
        }),
        keepalive: true,
      }).catch(() => {})
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') send()
  })
  window.addEventListener('pagehide', send, { once: true })
})()
