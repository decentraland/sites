import { useEffect, useState } from 'react'
import { getEnv } from '../../config/env'

interface BadgeEntity {
  id: string
  name: string
  description?: string
  imageUrl?: string
  category?: string
  tier?: string
  completedAt?: number
  isTier?: boolean
  completedTier?: { tierId: string; tierName: string; completedAt: number; assetUrl?: string }
}

interface BadgesResponse {
  data: {
    achieved?: BadgeEntity[]
    notAchieved?: BadgeEntity[]
  }
}

interface UseProfileBadgesResult {
  badges: BadgeEntity[]
  isLoading: boolean
}

const cache = new Map<string, BadgeEntity[]>()

const getBadgesApiUrl = (): string => {
  const url = getEnv('BADGES_API_URL')
  if (!url) throw new Error('BADGES_API_URL environment variable is not set')
  return url.replace(/\/+$/, '')
}

/* eslint-disable @typescript-eslint/naming-convention -- badges-api response keeps the "2d"/"3d" keys as the asset variant identifiers */
interface RawBadge extends BadgeEntity {
  assets?: { '2d'?: { normal?: string; hd?: string }; '3d'?: { normal?: string; hd?: string } }
}

function normalizeBadge(raw: RawBadge): BadgeEntity {
  // Badges API exposes the icon under `assets["2d"].normal` / `.hd`. Fall back
  // to `imageUrl` for older payload shapes and to `completedTier.assetUrl` when
  // the badge is tiered.
  const imageUrl = raw.imageUrl ?? raw.assets?.['2d']?.hd ?? raw.assets?.['2d']?.normal ?? raw.completedTier?.assetUrl
  return { ...raw, imageUrl }
}
/* eslint-enable @typescript-eslint/naming-convention */

async function fetchProfileBadges(address: string, signal?: AbortSignal): Promise<BadgeEntity[]> {
  const url = `${getBadgesApiUrl()}/users/${encodeURIComponent(address.toLowerCase())}/badges`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Failed to fetch badges (${response.status})`)
  const body = (await response.json()) as BadgesResponse
  const achieved = (body.data?.achieved ?? []) as RawBadge[]
  return achieved.map(normalizeBadge)
}

function useProfileBadges(address: string | undefined): UseProfileBadgesResult {
  const [badges, setBadges] = useState<BadgeEntity[]>(() => (address ? cache.get(address.toLowerCase()) ?? [] : []))
  const [isLoading, setIsLoading] = useState(Boolean(address) && !cache.has(address?.toLowerCase() ?? ''))

  useEffect(() => {
    if (!address) {
      setBadges([])
      setIsLoading(false)
      return undefined
    }
    const key = address.toLowerCase()
    const cached = cache.get(key)
    if (cached) {
      setBadges(cached)
      setIsLoading(false)
      return undefined
    }

    const controller = new AbortController()
    setIsLoading(true)
    void (async () => {
      try {
        const result = await fetchProfileBadges(key, controller.signal)
        if (controller.signal.aborted) return
        cache.set(key, result)
        setBadges(result)
      } catch (error) {
        if (controller.signal.aborted) return
        console.error('[useProfileBadges] failed to load:', error)
        setBadges([])
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    })()

    return () => controller.abort()
  }, [address])

  return { badges, isLoading }
}

export { useProfileBadges }
export type { BadgeEntity }
