#!/bin/bash
# Stop hook: enforce the 95% coverage floor on statements/lines/functions when src or
# spec files were edited in this session. Branches stay informational (current floor
# ~85%). Reads coverage/coverage-summary.json — cheap. If the summary is missing or
# any metric is below 95%, blocks the stop and tells Claude to add tests via the
# `coverage-keeper` agent. Backs the policy in CLAUDE.md rule 6.
set -u

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

if ! command -v jq >/dev/null 2>&1; then
  marker="${TMPDIR:-/tmp}/.claude-sites-jq-warned-$PPID"
  if [ ! -f "$marker" ]; then
    echo "WARNING: jq not found — .claude/hooks/stop-coverage-guard.sh is fail-open. Install with 'brew install jq'." >&2
    : > "$marker" 2>/dev/null
  fi
  exit 0
fi

input=$(cat)
transcript=$(printf '%s' "$input" | jq -r '.transcript_path // empty' 2>/dev/null)
stop_active=$(printf '%s' "$input" | jq -r '.stop_hook_active // false' 2>/dev/null)

# Avoid infinite loops: once we've blocked once and Claude is stopping again, let it through.
[ "$stop_active" = "true" ] && exit 0

# Only enforce when the session actually touched code or specs.
edited=""
if [ -n "$transcript" ] && [ -f "$transcript" ]; then
  edited=$(
    jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use") | select(.name=="Edit" or .name=="Write" or .name=="MultiEdit") | .input.file_path // empty' "$transcript" 2>/dev/null \
      | grep -E "/(src|api)/.*\.(ts|tsx|js|jsx)$" || true
  )
fi
[ -z "$edited" ] && exit 0

summary=coverage/coverage-summary.json
if [ ! -f "$summary" ]; then
  jq -n '{
    decision: "block",
    reason: "Coverage guard: src or spec files were edited but coverage/coverage-summary.json is missing. Run `npm run test:coverage` and confirm statements, lines, and functions are all >= 95% (CLAUDE.md rule 6). If any metric is below the floor, dispatch the coverage-keeper agent on the worst files."
  }'
  exit 0
fi

stmts=$(jq -r '.total.statements.pct' "$summary")
lines=$(jq -r '.total.lines.pct' "$summary")
funcs=$(jq -r '.total.functions.pct' "$summary")

below=$(awk -v s="$stmts" -v l="$lines" -v f="$funcs" 'BEGIN { print (s+0<95 || l+0<95 || f+0<95) ? "yes" : "no" }')
if [ "$below" != "yes" ]; then
  exit 0
fi

worst=$(jq -r '
  [ to_entries[] | select(.key!="total") | { f: .key, u: (.value.statements.total - .value.statements.covered) } | select(.u>0) ]
    | sort_by(-.u) | .[0:10] | .[] | "  - \(.f) (\(.u) uncovered stmts)"
' "$summary")

jq -n \
  --arg s "$stmts" --arg l "$lines" --arg f "$funcs" --arg worst "$worst" \
  '{
     decision: "block",
     reason: "Coverage floor violation — required >=95% on statements / lines / functions (CLAUDE.md rule 6).\nCurrent: statements=\($s)%, lines=\($l)%, functions=\($f)%.\n\nTop offenders by uncovered statements:\n\($worst)\n\nDispatch the coverage-keeper agent on the worst files (see .claude/agents/coverage-keeper.md), then re-run `npm run test:coverage` and stop only once the three metrics are back above the floor."
   }'
exit 0
