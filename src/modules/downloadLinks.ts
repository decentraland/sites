import { Architecture, OperativeSystem } from '../types/download.types'

interface ResolvedInstaller {
  link: string
  arch: Architecture
}

// @dcl/hooks reports 'Unknown' while Client Hints resolve, and keeps it when the browser
// does not expose the architecture. A Windows ARM machine reports 'arm64' but the launcher
// ships no ARM build, and the x64 one runs there under emulation. Any other architecture
// (ia32, for example) cannot run the amd64 installer, so it gets no fallback.
const AMD64_FALLBACK_ARCHS: ReadonlySet<string> = new Set(['Unknown', 'arm64'])

const pickLink = (osLinks: Record<string, string | undefined>, arch: Architecture): ResolvedInstaller | null => {
  const link = osLinks[arch]
  return link ? { link, arch } : null
}

/**
 * Picks the installer for a detected OS and architecture and returns it together with the
 * architecture of the artifact actually chosen, so the download events report what was served
 * and not what the browser claimed. macOS is arm64-first (the universal build), then amd64.
 */
const resolveInstaller = (
  os: string,
  detectedArch: string,
  osLinks: Record<string, string | undefined> | undefined
): ResolvedInstaller | null => {
  if (!osLinks) return null

  if (os === OperativeSystem.MACOS) return pickLink(osLinks, 'arm64') ?? pickLink(osLinks, 'amd64')

  const exact = pickLink(osLinks, detectedArch as Architecture)
  if (exact) return exact

  return AMD64_FALLBACK_ARCHS.has(detectedArch) ? pickLink(osLinks, 'amd64') : null
}

export { resolveInstaller }
