import { getEnv } from '../../config/env'
import { shopItemUrl } from '../../utils/shopUrl'

const FETCH_TIMEOUT_MS = 5000

const buildPlaceUrl = async (x: string | number, y: string | number, signal?: AbortSignal): Promise<string | null> => {
  const placesApiUrl = getEnv('PLACES_API_URL')
  if (!placesApiUrl) return null
  try {
    const response = await fetch(`${placesApiUrl}/places/?positions=${x},${y}`, {
      signal: signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS)
    })
    if (!response.ok) return null
    const data = (await response.json()) as { total: number | string; data?: Array<{ id: string }> }
    if (!data.data || data.data.length === 0) return null
    const placesBase = placesApiUrl.replace(/\/api$/, '')
    return `${placesBase}/place/?position=${x},${y}`
  } catch {
    return null
  }
}

const buildJumpInUrl = (x: string | number, y: string | number, realm?: string): string => {
  const explorerUrl = getEnv('JUMP_IN_URL') ?? '/jump'
  const params = new URLSearchParams({ position: `${x},${y}` })
  if (realm) params.set('realm', realm)
  return `${explorerUrl}?${params.toString()}`
}

const buildProfileUrl = (address: string): string => {
  const profileUrl = getEnv('PROFILE_URL') ?? 'https://profile.decentraland.org'
  return `${profileUrl}/accounts/${address}`
}

/**
 * The wearable worn in a reel, on the Shop — a reel's only commerce link, and buying happens there now.
 *
 * A reel's metadata can only describe worn wearables, so there is no category to check here the way the
 * profile's asset list has to.
 */
const buildWearableDetailUrl = (collectionId: string, blockchainId: string): string => shopItemUrl(collectionId, blockchainId)

const buildTwitterShareUrl = (description: string, url: string): string => {
  const params = new URLSearchParams({ text: description, url })
  return `https://twitter.com/intent/tweet?${params.toString()}`
}

// Canonical public URL for a single reel. ImageActions renders both on the standalone
// `/reels/:imageId` page and inside the profile PhotoModal (where `window.location` is the
// profile URL), so the shareable link must be derived from the image id, not the current page.
const buildReelUrl = (imageId: string): string => `${window.location.origin}/reels/${imageId}`

// camera-reel-service returns dateTime as a Unix epoch string in seconds (e.g. "1776199944").
// Some legacy entries may surface as ISO; accept both.
const formatPhotoDate = (dateTime: string): string => {
  const numeric = Number(dateTime)
  const date = Number.isFinite(numeric) && dateTime.trim() !== '' ? new Date(numeric * 1000) : new Date(dateTime)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })
}

export { buildJumpInUrl, buildPlaceUrl, buildProfileUrl, buildReelUrl, buildTwitterShareUrl, buildWearableDetailUrl, formatPhotoDate }
