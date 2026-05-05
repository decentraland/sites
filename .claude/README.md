# Agent Development Kit — sites

Project-level configuration for Claude Code working in this repo. Every hook, skill and agent here ties to a concrete rule in `CLAUDE.md`, a concrete path in this codebase, or a concrete workflow this repo follows. No generic Node-project boilerplate.

## Layers

| Layer           | Where                                      | What                                                                                                               |
| --------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| 1. Memory       | `CLAUDE.md` (repo root)                    | Always-loaded constitution. Architecture, conventions, pre-PR rules (1-23), security checklist. **Authoritative**. |
| 2. Knowledge    | `.claude/skills/`                          | On-demand workflows (auto-invoked by description match).                                                           |
| 3. Guardrails   | `.claude/hooks/` + `.claude/settings.json` | Deterministic shell scripts on tool events.                                                                        |
| 4. Delegation   | `.claude/agents/`                          | Subagents with isolated context.                                                                                   |
| 5. Distribution | _not packaged_                             | See "Bundling later" below.                                                                                        |

## Skills

- `add-i18n-key` — adding/editing translation keys with 6-locale parity (rule 9).
- `add-route` — placing a new route on the correct shell (lightweight vs `DappsShell`).
- `avatar-background-color` — applying ADR-292's deterministic background color on every avatar surface.
- `pre-pr-review` — runs the full pre-PR gate before `gh pr create`.

## Agents

- `code-reviewer` — repo-aware diff review against rules 1-23 + security checklist.
- `i18n-auditor` — verifies locale parity and detects duplicate keys.
- `route-architect` — designs new routes respecting the dual-shell boundary.

## Hooks

Registered in `.claude/settings.json`. Each one enforces a rule from `CLAUDE.md` or guards a path that, if destroyed, would break this specific repo:

| Event                               | Script                           | What it enforces (CLAUDE.md ref)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PreToolUse(Bash)                    | `pre-bash-block-destructive.sh`  | Blocks `npm install --package-lock-only` (rule 21), `git commit --no-verify` (Pre-commit checks), force-push to `origin master`, `git reset --hard`, `git clean -fd`, `git branch -D master`, and `rm -rf` on tracked source paths (`src/intl`, `src/shells`, `src/features`, `src/components`, `src/hooks`, `src/services`, `src/pages`, `.husky`, `.github`, `api`, `public`, `scripts`, `docs`). Regenerable artifacts (`node_modules`, `dist`, `.vite`) are NOT blocked — deleting them is a routine clean-install / cache-bust. |
| PreToolUse(Edit\|Write\|MultiEdit)  | `pre-write-warn-package-lock.sh` | Warns on direct edits to `package.json` / `package-lock.json`, and on edits to `src/config/env/{dev,stg,prd}.json` (these files ship to the client — secrets belong in Vercel env, not here).                                                                                                                                                                                                                                                                                                                                        |
| PreToolUse(Edit\|Write\|MultiEdit)  | `pre-write-warn-classname.sh`    | Warns when `className=` is being introduced into a `.tsx` file under `src/`. Decentraland's styled-components convention forbids `className`-driven descendant selectors — every child gets its own styled component (CLAUDE.md > Coding conventions > Styled components).                                                                                                                                                                                                                                                           |
| PostToolUse(Edit\|Write\|MultiEdit) | `post-edit-i18n-parity.sh`       | When `src/intl/en.json` changes, reminds about the 5 sibling locales (rule 9).                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| SessionStart                        | `session-start.sh`               | Prints branch + key reminders into the session context.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

Hooks require `jq` (Homebrew default on macOS). Missing `jq` → hooks no-op silently.

### Local overrides

If you need to bypass a hook locally without changing the team config, create `.claude/settings.local.json` (gitignored) with your override.

## Bundling later

If the team wants to install this kit into another repo (e.g. `marketplace`, `account`, `auth-dapp`), wrap `skills/`, `agents/`, `hooks/` and a copy of `settings.json` under `.claude/plugins/sites-agent-kit/` with a `plugin.json` manifest. Until then, this stays repo-local.

## Source of truth

When a skill or agent says "follow rule N", N refers to the numbered list under "Pre-PR review" in `CLAUDE.md` at the repo root.
