(() => {
  const forms = document.querySelectorAll('[data-newsletter-form]')

  for (const form of forms) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault()

      const button = form.querySelector('[type="submit"]')
      const label = form.querySelector('[data-submit-label]')
      const loading = form.querySelector('[data-submit-loading]')
      const error = document.querySelector(form.dataset.errorTarget || '[data-newsletter-error]')
      const formData = new FormData(form)

      button?.setAttribute('disabled', '')
      button?.setAttribute('aria-busy', 'true')
      label?.classList.add('hidden')
      loading?.classList.remove('hidden')
      error?.classList.add('hidden')

      try {
        const response = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(formData).toString(),
        })

        if (!response.ok) throw new Error(`Newsletter form returned ${response.status}`)

        fetch('/.netlify/functions/newsletter-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: form.dataset.newsletterSource || 'unknown' }),
          keepalive: true,
        }).catch(() => {})

        window.location.assign(form.getAttribute('action') || '/newsletter/success/')
      } catch (submissionError) {
        console.error('Newsletter submission failed', submissionError)
        error?.classList.remove('hidden')
        button?.removeAttribute('disabled')
        button?.removeAttribute('aria-busy')
        label?.classList.remove('hidden')
        loading?.classList.add('hidden')
      }
    })
  }
})()
