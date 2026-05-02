---
name: pre-pr-review
description: Use before running `gh pr create` or `git push`. Runs the full pre-PR gate from CLAUDE.md (format, lint, lint:pkg, build, test) plus the code-reviewer agent on the diff. Catches P0/P1 findings before the review bot blocks the PR. Triggers on "create PR", "open pull request", "ready to push", "pre-PR check".
---

# pre-pr-review

Mandatory gate before `git push` / `gh pr create` for `@dcl/landing-site`. Catches the same things the review bot would catch, locally.

## When to use

- Before pushing a branch.
- Before opening a PR.
- After significant rebase/merge conflicts.

## When NOT to use

- Mid-development snapshot — too slow on every save. Use `npm run lint -- --fix` while iterating.

## Steps (in order — stop on first failure)

```bash
npm run format            # 1. Prettier
npm run lint:fix          # 2. ESLint (auto-fix where possible)
npm run lint:pkg          # 3. package.json lint (silent on success — easy to skip; do not skip)
npm run build             # 4. tsc -b + vite build + hero prerender. Catches stricter TS than tsc --noEmit.
npm test                  # 5. Jest
```

If `4` succeeds but `npm run preview` blows up at runtime, see CLAUDE.md rule 14 (CJS-heavy deps).

## Step 6 — code-reviewer agent

Dispatch the project's `code-reviewer` agent on the diff:

> Use the `code-reviewer` subagent on `git diff master...HEAD`. Treat any P0 or P1 finding as a blocker. Surface P2 to me.

The agent enforces rules 1-23 from `CLAUDE.md` and the security checklist.

## Step 7 — barrier-specific spot checks

Beyond the agent, manually verify these high-risk patterns if your diff touches them:

| If the diff touches…                                     | Run                                                                         |
| -------------------------------------------------------- | --------------------------------------------------------------------------- |
| `src/intl/en.json`                                       | `i18n-auditor` agent (locale parity, rule 9)                                |
| New `<Route>` in `src/App.tsx`                           | `npm run build && npm run preview` then navigate dynamic variants (rule 14) |
| `package-lock.json` after rebase                         | `rm -rf node_modules package-lock.json && npm install` (rule 21)            |
| React HTML-injection prop (`dangerously-set-inner-html`) | DOMPurify with scoped allowlist (rule 19)                                   |
| iframe / embed URLs                                      | `new URL()` + hostname `Set` + regex ID (rule 20)                           |
| `src/shells/*` import outside `src/App.tsx`              | Boundary violation — STOP (rule 2)                                          |
| `src/config/env/*.json`                                  | Confirm no secrets — these ship to the client (security checklist)          |

## Step 8 — branch + commit hygiene

- Branch name: `<type>/<description>` (feat, fix, chore, docs, refactor, style, test) — ADR-6.
- Each commit: `<type>: <summary>` — single line, no `Co-Authored-By`, no body via HEREDOC.
- PR title: lowercase subject (action-semantic-pull-request CI requires it).
- PR description: concise, no Orca/Claude/review-bot attribution, no `## Summary` boilerplate.

## Step 9 — push + post-push

```bash
/opt/homebrew/bin/git push    # bypass Orca shim if active (CLAUDE.md > Orca attribution shim)
/opt/homebrew/bin/gh pr create --title "..." --body "..."
```

Immediately after `gh pr create`:

```bash
gh pr view <N>
gh api repos/decentraland/landing-site/pulls/<N>/comments
```

Triage review-bot findings before handing back to the user. Always include the full PR URL in the report.

## Pitfalls

- Skipping `lint:pkg` because it's silent on success.
- `npm run build` passes but `npm run preview` doesn't — still ship-broken (rule 14).
- Running tests only on changed files via `--testPathPattern` and missing a regression in a sibling suite.
- Pushing through Orca-wrapped `git` → `Co-authored-by: Orca` injected → ADR-6 violation.
