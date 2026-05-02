#!/bin/bash
# Block commands that CLAUDE.md explicitly prohibits or that would destroy
# repo-critical paths. Specific to landing-site — not a generic Node guard.
# Exit 2 -> blocks tool call, stderr surfaces to Claude.
set -u

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

# 1. Allow the rule-21 reset flow as a single chained command, even though it
#    contains 'rm -rf node_modules'. Detect first so subsequent guards skip it.
if printf '%s' "$command" | grep -Eq '^[[:space:]]*rm[[:space:]]+-rf?[[:space:]]+node_modules[[:space:]]+package-lock\.json[[:space:]]*&&[[:space:]]*npm[[:space:]]+install[[:space:]]*$'; then
  exit 0
fi

# 2. Destruction of repo-critical source paths.
if printf '%s' "$command" | grep -Eq 'rm[[:space:]]+-rf?[[:space:]]+(\.\./)*(src/intl|src/shells|src/features|src/components|src/hooks|src/services|src/pages|\.husky|\.github|api|public|scripts|docs)(\b|/)'; then
  block "would delete a repo-critical path tracked in git"
fi

# 3. Destruction of build/dependency artifacts outside the rule-21 flow.
if printf '%s' "$command" | grep -Eq 'rm[[:space:]]+-rf?[[:space:]]+(\.\./)*(node_modules|dist|\.vite)(\b|/)'; then
  block "deleting node_modules/dist/.vite in isolation can desync state" \
        "use 'rm -rf node_modules package-lock.json && npm install' (CLAUDE.md rule 21)"
fi

# 4. rule 21: --package-lock-only drops linux bindings, breaks CI on Vercel/Linux.
if printf '%s' "$command" | grep -Eq 'npm[[:space:]]+install[[:space:]]+(.*[[:space:]])?--package-lock-only'; then
  block "violates CLAUDE.md rule 21 — drops @rollup/rollup-linux-*, @esbuild/linux-*, @napi-rs/* bindings, npm ci on linux-x64 will fail" \
        "rm -rf node_modules package-lock.json && npm install"
fi

# 5. CLAUDE.md > Pre-commit checks: 'Never use --no-verify'.
if printf '%s' "$command" | grep -Eq 'git[[:space:]]+commit[[:space:]]+(.*[[:space:]])?--no-verify'; then
  block "CLAUDE.md > Pre-commit checks: 'Never use --no-verify'" \
        "fix the failing pre-commit hook instead"
fi

# 6. Force push to origin master (squash-merge target per ADR-6).
if printf '%s' "$command" | grep -Eq 'git[[:space:]]+push[[:space:]]+(.*[[:space:]])?(--force|--force-with-lease|-f[[:space:]])'; then
  if printf '%s' "$command" | grep -Eq 'origin[[:space:]]+(master|main)\b|HEAD:?(master|main)\b'; then
    block "force-pushing to origin master is forbidden — master is the squash-merge target" \
          "open a PR or push to your feature branch"
  fi
fi

# 7. git reset --hard — risk of overwriting uncommitted work.
if printf '%s' "$command" | grep -Eq 'git[[:space:]]+reset[[:space:]]+--hard'; then
  block "git reset --hard discards uncommitted changes" \
        "stash first ('git stash'), or use 'git reset --keep' / 'git reset --merge'"
fi

# 8. git clean -fd — risk of nuking untracked work-in-progress.
if printf '%s' "$command" | grep -Eq 'git[[:space:]]+clean[[:space:]]+-[a-z]*f[a-z]*d'; then
  block "git clean -fd removes untracked files (incl. WIP)" \
        "run 'git clean -nd' first to preview what would be removed"
fi

# 9. Deleting master/main branch locally.
if printf '%s' "$command" | grep -Eq 'git[[:space:]]+branch[[:space:]]+-D[[:space:]]+(master|main)\b'; then
  block "refusing to delete the master/main branch"
fi

exit 0
