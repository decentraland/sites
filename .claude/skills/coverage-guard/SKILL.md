---
name: coverage-guard
description: Run on demand to check the coverage floor (>=95% statements / lines / functions per CLAUDE.md rule 6). Reports current totals plus the 10 worst files by uncovered statements, and dispatches the coverage-keeper agent on them when the floor is breached. Triggers on /coverage-guard, "check coverage", "coverage floor", "verify coverage", or before opening a PR that adds non-trivial src changes.
---

# coverage-guard

Enforce the 95% floor on statements, lines, and functions for `@dcl/sites`. Branches stay informational (current floor ~85%, listed but not blocking).

## When to use

- Before `gh pr create` whenever the diff touches `src/**` or `api/**`.
- After a large refactor or dapp absorption that adds new modules.

## When NOT to use

- For doc-only / `.github/`-only / config-only diffs.
- During an active TDD red-green loop — let the test you just wrote settle first.

## Steps

### 1. Run coverage

```bash
npm run test:coverage -- --silent --coverageReporters=json-summary --coverageReporters=text-summary
```

This writes `coverage/coverage-summary.json`. There is no automatic Stop-hook enforcement (removed 2026-05-20 for token cost — see docs/skills-registry.md); the floor is policy, run this skill manually before PRs.

### 2. Read the totals + top offenders

```bash
node -e '
const t = require("./coverage/coverage-summary.json").total;
console.log("Statements:", t.statements.pct + "%", "(" + t.statements.covered + "/" + t.statements.total + ")");
console.log("Lines:    ", t.lines.pct + "%", "(" + t.lines.covered + "/" + t.lines.total + ")");
console.log("Functions:", t.functions.pct + "%", "(" + t.functions.covered + "/" + t.functions.total + ")");
console.log("Branches: ", t.branches.pct + "%", "(" + t.branches.covered + "/" + t.branches.total + ") [informational]");
const items = Object.entries(require("./coverage/coverage-summary.json"))
  .filter(([k]) => k !== "total")
  .map(([f, d]) => ({ f: f.replace(process.cwd() + "/", ""), u: d.statements.total - d.statements.covered, p: d.statements.pct }))
  .filter(x => x.u > 0).sort((a, b) => b.u - a.u).slice(0, 10);
console.log("\nTop offenders by uncovered statements:");
items.forEach(x => console.log("  " + String(x.u).padStart(3) + " uncovered (" + x.p.toFixed(0) + "%) " + x.f));
'
```

### 3. Decide

| State                           | Action                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| Stmts / lines / funcs all >= 95 | Report green totals. Done.                                                           |
| Any below 95                    | Dispatch the `coverage-keeper` agent on the top offenders, then loop back to step 1. |

When dispatching, pass the agent the list of files printed in step 2 plus the relevant CLAUDE.md rule references (rule 6 for the floor, rule 18 to forbid RTK Query internal-state probing in any new spec).

### 4. Re-verify

After the agent writes specs, re-run step 1 and confirm:

- All three metrics back >= 95.
- `npm test` still passes.
- `npm run lint` clean.

## Rules to respect (cite when reviewing the agent's output)

- **Rule 6** (CLAUDE.md "Pre-PR review") — new providers/shells/layouts need a smoke test; new reducers/RTK Query clients need a `reducerPath` assertion.
- **Rule 18** — never reach into `state.<x>Client.queries.*` via `as any`. Use `endpoints.X.select(args)(state)` or assert cache-key behavior via dedup of `initiate(...)` calls.
- **Rule 17** — endpoint files must not import the store for dispatch; tests must not assume they do.
- **Rule 22** — assertions against `transformResponse`/`queryFn` outputs must treat the data as immutable.

## Output

A short report:

```
Coverage: stmts X% / lines Y% / funcs Z% / branches W%
Floor breach: <list metrics below 95, or "none">
Top offenders: <10 lines with file + uncovered count>
Next: <"green — nothing to do" | "dispatching coverage-keeper on N files">
```
