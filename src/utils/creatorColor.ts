const NEUTRAL_FALLBACK = '#262626'
const HUE_MAX = 360

// Hash → HSL with fixed S/L gives every wallet a stable, visually balanced
// color (no two creators look identical, but the same creator looks the same
// in every UI surface — Live Now card, modal, future-event card).
function getCreatorColor(address: string | undefined | null): string {
  if (!address) return NEUTRAL_FALLBACK
  const normalized = address.trim().toLowerCase()
  if (!normalized) return NEUTRAL_FALLBACK

  // djb2 with a `| 0` int32 coercion so the loop stays in fast SMI math.
  // `Math.abs` on the resulting signed int32 never overflows in JS (no Java/C
  // edge case for INT_MIN), so `% HUE_MAX` is always a non-negative hue.
  let hash = 5381
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash + normalized.charCodeAt(i)) | 0
  }
  const hue = Math.abs(hash) % HUE_MAX
  return `hsl(${hue} 45% 40%)`
}

export { getCreatorColor }
