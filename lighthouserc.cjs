module.exports = {
  ci: {
    collect: {
      url: [
        'https://carteakey.dev/',
        'https://carteakey.dev/blog/',
        'https://carteakey.dev/now/',
      ],
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--headless --no-sandbox',
      },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:performance': ['warn', { minScore: 0.75 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-reports',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%.report.%%EXTENSION%%',
    },
  },
}
