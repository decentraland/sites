#!/bin/bash
# Warn when introducing `className=` in .tsx under src/.
# Decentraland's styled-components convention forbids className-driven descendant
# selectors — every child gets its own styled component instead. See CLAUDE.md
# > Coding conventions > Styled components.
set -u

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

input=$(cat)

file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
[ -z "$file_path" ] && exit 0

case "$file_path" in
  */src/*.tsx) ;;
  *) exit 0 ;;
esac

# Pull every "new" string the tool would write: Write.content, Edit.new_string,
# and the joined new_strings of MultiEdit.edits[].
content=$(printf '%s' "$input" | jq -r '
  [
    .tool_input.content       // empty,
    .tool_input.new_string    // empty,
    ((.tool_input.edits // []) | map(.new_string) | join("\n"))
  ] | join("\n")
' 2>/dev/null)

# Match a JSX className prop:  className="..."  or  className={...}
if printf '%s' "$content" | grep -Eq 'className[[:space:]]*=[[:space:]]*("|\{)'; then
  {
    echo "WARNING: className= introduced in $file_path."
    echo
    echo "Decentraland's styled-components convention (CLAUDE.md > Coding conventions > Styled components) forbids className props on rendered elements."
    echo "Every child needs its own styled component instead of being styled via descendant '& .foo' selectors."
    echo
    echo "Avoid:"
    echo "  <Container>"
    echo "    <img className=\"my-icon\" src={src} />"
    echo "  </Container>"
    echo "  // Container.styled.ts"
    echo "  styled(Box)({ '& .my-icon': { width: 24 } })"
    echo
    echo "Use instead:"
    echo "  <Container>"
    echo "    <MyIcon src={src} />"
    echo "  </Container>"
    echo "  // Container.styled.ts"
    echo "  styled('img')({ width: 24 })  // exported as MyIcon"
    echo
    echo "If a parent needs to vary the child by state, expose the variant as a prop on the child styled component with shouldForwardProp."
  } >&2
fi

exit 0
