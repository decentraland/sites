---
name: add-i18n-key
description: Use when adding, editing, or removing a translation key in src/intl/*.json. Enforces 6-locale parity (en, es, fr, ja, ko, zh) and detects duplicate top-level keys. Triggers when the user mentions "translation", "i18n", "locale", "intl", "translation key", or edits any file under src/intl/.
---

# add-i18n-key

Repo has **6 locale files** in `src/intl/`: `en.json` (source of truth), `es.json`, `fr.json`, `ja.json`, `ko.json`, `zh.json`. Every key must exist in all six. A missing key silently renders the English copy (`LocaleContext` sets `fallbackLocale="en"`), so nothing in the UI reveals the gap; `npm run lint:i18n` (CI + lint-staged) is what catches it, and the review bot flags it as **P2**.

Known debt is tracked in `src/intl/parity-baseline.json` as exact `(locale, type, key)` sets. The check fails on any key not in the baseline AND on any baselined key that is no longer missing (prune it). Counts never matter, only sets.

## When to use

- Adding a new translation key.
- Editing an existing key's value/copy.
- Removing a key.
- Auditing locale parity before a PR.

## When NOT to use

- For runtime translation lookups in components — use `useFormatMessage()` from `src/hooks/adapters/useFormatMessage.ts`.

## Steps

1. **Edit `src/intl/en.json` first.** It is the source of truth.
2. Mirror the change in all five sibling locales. Use the same key path. Translation can be the English string verbatim if a real translation isn't available — anything beats a missing key.
3. Run the check:
   ```bash
   npm run lint:i18n
   ```
   It reports duplicate members at any depth (with line:column), comments, trailing commas, and every key missing/extra/mismatched per locale that is not already in the baseline. Do NOT use `Object.keys` after `JSON.parse` to look for duplicates: the parser has already collapsed them.
4. If you fixed keys that were in `src/intl/parity-baseline.json`, prune them with `npm run lint:i18n -- --write-baseline` and commit the smaller baseline. Never run `--write-baseline` to make a NEW missing key pass; add the key to the locale instead.
5. Run `npm run format` to normalize JSON.
6. Commit all six files (and the baseline, if it shrank) in one commit.

## Namespace conventions

| Page / area        | Namespace                      |
| ------------------ | ------------------------------ |
| Landing sections   | `component.landing.*`          |
| Creators page      | `component.creators_landing.*` |
| Page meta (Helmet) | `page.<route>.*`               |
| Whats-on           | `component.whats_on.*`         |
| Blog               | `component.blog.*`             |

## Reference command (parity audit, all keys)

Use the `i18n-auditor` agent when adding many keys or before a release.

## Pitfalls

- Editing only `en.json` and pushing — review-bot flags it P2.
- Adding the key as a duplicate member (top-level or nested) instead of merging into the existing object — `npm run lint:i18n` catches it with the line and column.
- Running `--write-baseline` to silence a new missing key — the baseline diff shows up in the PR and reviewers will ask why.
- Forgetting `npm run format` — Prettier reorders JSON; CI fails.
