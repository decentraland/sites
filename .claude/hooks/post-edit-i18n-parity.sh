#!/bin/bash
# After editing src/intl/en.json, remind about the 5 sibling locales (CLAUDE.md rule 9).
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
  */src/intl/*.json)
    # Run the real check (strict JSON, duplicate members, exact-set parity vs the committed
    # baseline). Its output goes to Claude's context; exit 0 so the edit itself is never blocked.
    {
      echo "i18n check after editing ${file_path##*/src/intl/}:"
      (cd "${CLAUDE_PROJECT_DIR:-.}" && node scripts/check-i18n.mjs 2>&1) || echo "Fix the findings above before committing (CLAUDE.md rule 9, skill 'add-i18n-key'). New debt is only accepted through 'npm run lint:i18n -- --write-baseline' with a reason in the PR."
    } >&2
    ;;
esac

exit 0
