// Lighthouse CI against production. The monthly workflow runs this and
// utils/lighthouse-history.mjs appends the representative run of each URL to
// src/_data/lighthouse.json, which /stats/ charts. Pull requests use
// lighthouserc.ci.cjs (the built _site/) instead.
module.exports = {
  ci: {
    collect: {
      url: [
        "https://carteakey.dev/",
        "https://carteakey.dev/blog/",
        "https://carteakey.dev/now/",
        // A long post with tables and images: the heaviest common page.
        "https://carteakey.dev/blog/local-inference/optimizing-gpt-oss-120b-local-inference/",
      ],
      // Three runs per URL; LHCI marks the median one as representative.
      numberOfRuns: 3,
      settings: {
        chromeFlags: "--headless --no-sandbox",
      },
    },
    assert: {
      assertions: {
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.85 }],
        "categories:performance": ["warn", { minScore: 0.75 }],
        "categories:seo": ["error", { minScore: 0.9 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 3000 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./lighthouse-reports",
      reportFilenamePattern: "%%PATHNAME%%-%%DATETIME%%.report.%%EXTENSION%%",
    },
  },
};
