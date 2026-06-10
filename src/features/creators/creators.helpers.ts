import { getEnv } from '../../config/env'
import type { CreatorWorld } from './creators.types'

const FALLBACK_WORLDS_CONTENT_SERVER_URL = 'https://worlds-content-server.decentraland.org'

// `getEnv` returns '' (not undefined) for unset keys, so guard with `||`.
// NOTE: lazy getter (never throws at module top-level) — this file is reachable
// from the shell chunk via the placesClient injection (pre-PR rule 16).
const getWorldsContentServerUrl = (): string => getEnv('WORLDS_CONTENT_SERVER_URL') || FALLBACK_WORLDS_CONTENT_SERVER_URL

// Hosted bevy-web build (decentraland.zone) — same target the discover scene
// watcher embeds. `iframe` runs in scene-viewer mode (no launcher/portables);
// `external` opens the full client in a new tab. Mirrors DiscoverScenePage's
// buildBevyHrefs so the creator preview behaves identically to /discover.
function buildBevyHrefs(worldName: string): { iframe: string; external: string } {
  const base = 'https://decentraland.zone/bevy-web/'
  const external = `${base}?realm=${encodeURIComponent(worldName)}`
  return { iframe: `${external}&systemScene=sceneviewer.dcl.eth&portables=none`, external }
}

// scene.json `runtimeVersion` → display label. '7' (and unset on modern
// deploys) maps to SDK 7; anything else is legacy SDK 6.
function sdkVersionLabel(runtimeVersion: string | undefined): string {
  if (!runtimeVersion) return 'SDK 7'
  return runtimeVersion === '7' ? 'SDK 7' : 'SDK 6'
}

// Path to a world's creator dashboard. Lower-cased so links are canonical
// regardless of how the name was cased upstream.
function buildCreatorWorldPath(worldName: string): string {
  return `/creators/world/${encodeURIComponent(worldName.toLowerCase())}`
}

// Merge the two ownership sources (DCL names the wallet owns + contributable
// domains it collaborates on) into a deduped, sorted world list. Mirrors the
// storage SelectPage merge so both surfaces agree on the world set.
function mergeCreatorWorlds(ownedNames: string[] | undefined, collaboratorDomains: { name: string }[] | undefined): CreatorWorld[] {
  const merged = new Map<string, CreatorWorld>()
  ;(ownedNames ?? []).forEach(name => {
    const key = name.toLowerCase()
    merged.set(key, { name: key, role: 'owner' })
  })
  ;(collaboratorDomains ?? []).forEach(domain => {
    const key = domain.name.toLowerCase()
    if (!merged.has(key)) merged.set(key, { name: key, role: 'collaborator' })
  })
  return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name))
}

// Resolve a scene.json `navmapThumbnail` (a content file path) to its CDN URL
// by matching it against the deployment's content manifest.
function resolveThumbnailUrl(
  navmapThumbnail: string | undefined,
  content: Array<{ file: string; hash: string }> | undefined
): string | undefined {
  if (!navmapThumbnail || !content) return undefined
  const match = content.find(entry => entry.file === navmapThumbnail)
  if (!match) return undefined
  return `${getWorldsContentServerUrl()}/contents/${match.hash}`
}

export { buildBevyHrefs, buildCreatorWorldPath, getWorldsContentServerUrl, mergeCreatorWorlds, resolveThumbnailUrl, sdkVersionLabel }
