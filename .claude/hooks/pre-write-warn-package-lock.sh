#!/bin/bash
# Warn (not block) when editing files this repo treats specially:
#  - package.json / package-lock.json  -> prefer 'npm install <pkg>'
#  - src/config/env/*.json             -> these ship to the client; secrets must NOT live here
set -u

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
[ -z "$file_path" ] && exit 0

case "$file_path" in
  */package-lock.json)
    echo "WARNING: editing package-lock.json directly. Prefer 'npm install <pkg>' / 'npm uninstall <pkg>'. After rebase conflicts: rm -rf node_modules package-lock.json && npm install (CLAUDE.md rule 21)." >&2
    ;;
  */package.json)
    echo "WARNING: editing package.json deps directly. Use 'npm install --save-exact <pkg>' (or '^' for @dcl/* and decentraland-*). See CLAUDE.md > Dependencies." >&2
    ;;
  */src/config/env/dev.json|*/src/config/env/stg.json|*/src/config/env/prd.json)
    {
      echo "WARNING: editing $file_path."
      echo "These files SHIP TO THE CLIENT in the bundle. Never put secrets, API keys, or tokens here."
      echo "Server-only secrets belong in Vercel env vars, accessed from api/seo.ts via process.env.*."
      echo "See CLAUDE.md > Security checklist."
    } >&2
    ;;
esac

exit 0
