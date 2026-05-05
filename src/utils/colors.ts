// Convert a hex color into an `rgba(r, g, b, alpha)` string. `decentraland-ui2`
// ships a similar helper at `decentraland-ui2/utils/colors`, but it's not
// re-exported from the public barrel; importing the deep path is fragile.
function hexToRgba(hex: string, alpha = 1): string {
  const isShortHex = /^#[0-9A-Fa-f]{3}$/.test(hex)
  const isLongHex = /^#[0-9A-Fa-f]{6}$/.test(hex)
  if (!isShortHex && !isLongHex) throw new Error(`Invalid hexadecimal color: ${hex}`)
  if (alpha < 0 || alpha > 1) throw new Error(`Invalid alpha value: ${alpha}`)
  const normalized = isShortHex ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex
  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export { hexToRgba }
