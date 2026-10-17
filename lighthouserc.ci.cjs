// Lighthouse CI on the built _site/ in the build workflow (pull requests and
// pushes to main). Warn-only: CI has no secrets, so pages render their fallback
// data, and a local static server is not production. The point is to catch a
// regression in the diff, not to grade the site; lighthouserc.cjs does that.
module.exports = {
  ci: {
    collect: {
      staticDistDir: "./_site",
      url: [
        "/",
        "/blog/",
        "/now/",
        "/blog/local-inference/optimizing-gpt-oss-120b-local-inference/",
      ],
      numberOfRuns: 1,
      settings: {
        chromeFlags: "--headless --no-sandbox",
      },
    },
    // Ceilings sit just above the 2026-10-17 measurements (heaviest page: the
    // gpt-oss post at 367 KB JS, 50 KB CSS, 871 KB fonts, 2.2 MB total). Lower
    // them as fixes land; never raise one to quiet a warning.
    assert: {
      assertions: {
        "categories:accessibility": ["warn", { minScore: 0.85 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "total-blocking-time": ["warn", { maxNumericValue: 400 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.15 }],
        "resource-summary:script:size": ["warn", { maxNumericValue: 400000 }],
        "resource-summary:stylesheet:size": [
          "warn",
          { maxNumericValue: 60000 },
        ],
        "resource-summary:font:size": ["warn", { maxNumericValue: 950000 }],
        "resource-summary:total:size": ["warn", { maxNumericValue: 2500000 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./lighthouse-reports",
    },
  },
};
