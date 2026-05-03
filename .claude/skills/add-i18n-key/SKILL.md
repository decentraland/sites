---
name: add-i18n-key
description: Use when adding, editing, or removing a translation key in src/intl/*.json. Enforces 6-locale parity (en, es, fr, ja, ko, zh) and detects duplicate top-level keys. Triggers when the user mentions "translation", "i18n", "locale", "intl", "translation key", or edits any file under src/intl/.
---

# add-i18n-key

Repo has **6 locale files** in `src/intl/`: `en.json` (source of truth), `es.json`, `fr.json`, `ja.json`, `ko.json`, `zh.json`. Every key must exist in all six. Missing locales fall back to the raw key, which the review-bot CI flags as **P2**.

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
3. Verify no duplicate top-level keys:
   ```bash
   node -e 'const j=require("./src/intl/en.json");const k=Object.keys(j);if(new Set(k).size!==k.length)throw new Error("dupe keys")'
   ```
4. Verify the key resolves in every locale:
   ```bash
   for f in en es fr ja ko zh; do node -e "const j=require('./src/intl/${f}.json'); const v=j.path?.to?.your_key; if(!v) throw new Error('${f}: missing'); console.log('${f}:', v)"; done
   ```
   Replace `path.to.your_key` with the actual nested path.
5. Run `npm run format` to normalize JSON.
6. Commit all six files in one commit.

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
- Adding the key as a duplicate top-level entry instead of nesting — `node -e` check above catches it.
- Forgetting `npm run format` — Prettier reorders JSON; CI fails.
