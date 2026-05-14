#!/bin/bash
# After editing src/App.tsx (the router), remind about updating the README
# route table so it stays in sync with the real route map.
set -u

if ! command -v jq >/dev/null 2>&1; then
  marker="${TMPDIR:-/tmp}/.claude-sites-jq-warned-$PPID"
  if [ ! -f "$marker" ]; then
    echo "WARNING: jq not found — .claude/hooks/* operate in fail-open mode (no guards). Install with 'brew install jq'." >&2
    : > "$marker" 2>/dev/null
  fi
  exit 0
fi

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
[ -z "$file_path" ] && exit 0

case "$file_path" in
  */src/App.tsx)
    {
      echo "REMINDER: src/App.tsx changed. If routes were added, removed, or renamed, update the route table in README.md ('What lives here' section) in the SAME PR."
      echo "Check both the route column AND the Notes column (legacy redirects, 404 catch-alls). Skill: 'add-route'."
    } >&2
    ;;
esac

exit 0
