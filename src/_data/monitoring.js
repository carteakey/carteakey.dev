function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value))
}

export default function () {
  const configuredRate = Number(process.env.WEB_VITALS_SAMPLE_RATE ?? 0.1)

  return {
    webVitalsEnabled: process.env.WEB_VITALS_ENABLED !== 'false',
    webVitalsSampleRate: Number.isFinite(configuredRate)
      ? clamp(configuredRate, 0, 1)
      : 0.1,
  }
}
