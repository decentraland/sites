#!/bin/bash
# Print branch + key reminders at session start. stdout is appended to Claude's context.
set -u

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

branch=$(git branch --show-current 2>/dev/null)
upstream=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || echo "(none)")

cat <<EOF
landing-site session — quick reminders:
  branch: ${branch:-unknown}  upstream: ${upstream}
  pm: npm only (Dependencies section in CLAUDE.md)
  i18n: 6 locales, en is source (rule 9)
  shells: lightweight routes MUST NOT import src/shells/* (rule 2)
  pre-PR: format -> lint:fix -> lint:pkg -> build -> test -> code-reviewer agent
  see CLAUDE.md "Pre-PR review" rules 1-23 and "Security checklist"
EOF

exit 0
