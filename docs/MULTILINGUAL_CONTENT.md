# Multilingual content

English remains the default language. Translations are opt-in and live at language-prefixed URLs such as `/hi/`; untranslated pages keep their existing URLs.

Add these fields to every page in a translated set:

```yaml
language: hi
ogLocale: hi_IN
translations:
  - language: en
    label: English
    shortLabel: EN
    ogLocale: en_CA
    url: /original-page/
  - language: hi
    label: हिन्दी
    shortLabel: हिं
    ogLocale: hi_IN
    url: /hi/translated-page/
```

The base layout then provides:

- the correct HTML `lang` attribute and optional `direction` for right-to-left languages;
- canonical and `hreflang` links, including `x-default` for English;
- Open Graph locale and alternate-locale metadata;
- a compact language switcher shown only when at least two versions exist.

Use a stable URL for each translation and give permanent content an explicit `date`. Translate the title, description, visible body, image alt text, and page-specific accessibility labels. Do not claim that an untranslated destination is localized; linking back into the English archive is fine when the copy says so.

For an RTL language, add `direction: rtl`. Keep code samples and language names marked with their own `dir` or `lang` when needed.
