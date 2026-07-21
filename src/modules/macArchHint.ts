/**
 * Best-effort Mac CPU-architecture hint for download analytics.
 *
 * The browser hides the real Mac chip everywhere that would be convenient:
 * the User-Agent reports "Intel Mac OS X" even on Apple Silicon, and
 * userAgentData.architecture comes back empty (Safari doesn't ship it at
 * all). The one reliable signal is the GPU — Apple Silicon Macs always have
 * an Apple GPU, Intel Macs never do — exposed through WebGL's unmasked
 * renderer string (e.g. "ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro…)"
 * vs "ANGLE (Intel, Intel(R) Iris(TM) Plus Graphics…)").
 *
 * Why this matters: the launcher DMG is arm64-only. An Intel Mac downloads
 * it fine and then cannot open it, firing zero telemetry — invisible in the
 * funnel. This hint is the only place in the whole pipeline where that
 * cohort can be measured. iPads in desktop mode also report "Macintosh" but
 * resolve to an Apple GPU, so they can never be misread as `intel`.
 */
type MacArchHint = 'apple_silicon' | 'intel' | 'unknown'

// One WebGL context per page load at most: the GPU can't change mid-session.
let cachedHint: MacArchHint | null | undefined

function readWebGlRenderer(): string | null {
  const canvas = document.createElement('canvas')
  const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
  if (!gl) return null

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  const renderer = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : null

  // Free the context eagerly — some browsers cap live WebGL contexts.
  gl.getExtension('WEBGL_lose_context')?.loseContext()

  return renderer
}

function detect(): MacArchHint | null {
  if (!/Macintosh|Mac OS X/.test(navigator.userAgent)) return null

  try {
    const renderer = readWebGlRenderer()
    if (!renderer) return 'unknown'
    if (/apple/i.test(renderer)) return 'apple_silicon'
    if (/intel|amd|radeon/i.test(renderer)) return 'intel'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

function getMacArchHint(): MacArchHint | null {
  if (cachedHint === undefined) {
    cachedHint = detect()
  }
  return cachedHint
}

/**
 * Attaches `mac_arch` to a click payload when the visitor is on macOS.
 * Shared by `useDownloadClick` and `useTrackClick` so the property name and
 * the omit-off-macOS rule live in exactly one place.
 */
function attachMacArchHint(payload: Record<string, unknown>): void {
  const macArch = getMacArchHint()
  if (macArch) {
    payload.mac_arch = macArch
  }
}

export { attachMacArchHint, getMacArchHint }
export type { MacArchHint }
