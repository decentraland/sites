#!/bin/bash
# After editing src/intl/en.json, remind about the 5 sibling locales (CLAUDE.md rule 9).
set -u

if ! command -v jq >/dev/null 2>&1; then
  marker="${TMPDIR:-/tmp}/.claude-landing-site-jq-warned-$PPID"
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
  */src/intl/en.json)
    {
      echo "REMINDER: en.json changed. Mirror the new/edited keys in:"
      echo "  src/intl/es.json"
      echo "  src/intl/fr.json"
      echo "  src/intl/ja.json"
      echo "  src/intl/ko.json"
      echo "  src/intl/zh.json"
      echo "The review-bot CI flags missing locales as P2. Skill: 'add-i18n-key'."
    } >&2
    ;;
  */src/intl/es.json|*/src/intl/fr.json|*/src/intl/ja.json|*/src/intl/ko.json|*/src/intl/zh.json)
    echo "REMINDER: also verify en.json has the same keys (en.json is the source of truth)." >&2
    ;;
esac

exit 0
