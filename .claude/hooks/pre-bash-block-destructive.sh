#!/bin/bash
# Block commands that CLAUDE.md explicitly prohibits or that would destroy
# repo-critical paths. Specific to sites — not a generic Node guard.
# Exit 2 -> blocks tool call, stderr surfaces to Claude.
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
command=$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null)
[ -z "$command" ] && exit 0

block() {
  {
    echo "BLOCKED by .claude/hooks/pre-bash-block-destructive.sh"
    echo "Command: $command"
    echo "Reason : $1"
    [ -n "${2:-}" ] && echo "Recovery: $2"
  } >&2
  exit 2
}

# 1. Destruction of repo-critical source paths.
if printf '%s' "$command" | grep -Eq 'rm[[:space:]]+-rf?[[:space:]]+(\.\./)*(src/intl|src/shells|src/features|src/components|src/hooks|src/services|src/pages|\.husky|\.github|api|public|scripts|docs)(\b|/)'; then
  block "would delete a repo-critical path tracked in git"
fi

# 2. rule 21: --package-lock-only drops linux bindings, breaks CI on Vercel/Linux.
if printf '%s' "$command" | grep -Eq 'npm[[:space:]]+install[[:space:]]+(.*[[:space:]])?--package-lock-only'; then
  block "violates CLAUDE.md rule 21 — drops @rollup/rollup-linux-*, @esbuild/linux-*, @napi-rs/* bindings, npm ci on linux-x64 will fail" \
        "rm -rf node_modules package-lock.json && npm install"
fi

# 3. CLAUDE.md > Pre-commit checks: 'Never use --no-verify'.
if printf '%s' "$command" | grep -Eq 'git[[:space:]]+commit[[:space:]]+(.*[[:space:]])?--no-verify'; then
  block "CLAUDE.md > Pre-commit checks: 'Never use --no-verify'" \
        "fix the failing pre-commit hook instead"
fi

# 4. Force push to origin master (squash-merge target per ADR-6).
if printf '%s' "$command" | grep -Eq 'git[[:space:]]+push[[:space:]]+(.*[[:space:]])?(--force(-with-lease)?|-f([[:space:]]|$))'; then
  if printf '%s' "$command" | grep -Eq 'origin[[:space:]]+(master|main)\b|HEAD:?(master|main)\b'; then
    block "force-pushing to origin master is forbidden — master is the squash-merge target" \
          "open a PR or push to your feature branch"
  fi
fi

# 5. git reset --hard — risk of overwriting uncommitted work.
if printf '%s' "$command" | grep -Eq 'git[[:space:]]+reset[[:space:]]+--hard'; then
  block "git reset --hard discards uncommitted changes" \
        "stash first ('git stash'), or use 'git reset --keep' / 'git reset --merge'"
fi

# 6. git clean -fd — risk of nuking untracked work-in-progress.
if printf '%s' "$command" | grep -Eq 'git[[:space:]]+clean[[:space:]]+-[a-z]*f[a-z]*d'; then
  block "git clean -fd removes untracked files (incl. WIP)" \
        "run 'git clean -nd' first to preview what would be removed"
fi

# 7. Deleting master/main branch locally.
if printf '%s' "$command" | grep -Eq 'git[[:space:]]+branch[[:space:]]+-D[[:space:]]+(master|main)\b'; then
  block "refusing to delete the master/main branch"
fi

exit 0
