import { useEffect, useState } from 'react'
import { getEnv } from '../../config/env'

interface BadgeProgress {
  stepsDone: number
  nextStepsTarget: number | null
  totalStepsTarget: number
  lastCompletedTierAt: string | null
  lastCompletedTierName: string | null
  lastCompletedTierImage: string | null
}

interface BadgeEntity {
  id: string
  name: string
  description: string
  category: string
  isTier: boolean
  /** Unix timestamp in ms as a string (badges-api ships it stringified). `null` for not-yet-achieved badges. */
  completedAt: string | null
  /** Resolved icon URL — picked from `progress.lastCompletedTierImage` for tiered badges, otherwise `assets["2d"].normal`. */
  imageUrl?: string
  /** Display name of the tier the user has reached (only set when `isTier`). */
  tierName?: string
  progress: BadgeProgress
}

/* eslint-disable @typescript-eslint/naming-convention -- badges-api response keeps the "2d"/"3d" keys as asset variant identifiers */
interface RawBadge extends Omit<BadgeEntity, 'imageUrl' | 'tierName'> {
  assets?: {
    '2d'?: { normal?: string }
    '3d'?: { normal?: string; hrm?: string; basecolor?: string }
  }
}
/* eslint-enable @typescript-eslint/naming-convention */

interface BadgesResponse {
  data: {
    achieved?: RawBadge[]
    notAchieved?: RawBadge[]
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

function normalizeBadge(raw: RawBadge): BadgeEntity {
  // For tiered badges the API stores the achieved tier's icon under
  // `progress.lastCompletedTierImage`; non-tiered badges expose the static icon
  // under `assets["2d"].normal`. Fall back gracefully so the UI still renders
  // even when one of the two paths is missing.
  const imageUrl = raw.progress?.lastCompletedTierImage ?? raw.assets?.['2d']?.normal ?? undefined
  const tierName = raw.progress?.lastCompletedTierName ?? undefined
  return { ...raw, imageUrl, tierName }
}

async function fetchProfileBadges(address: string, signal?: AbortSignal): Promise<BadgeEntity[]> {
  const url = `${getBadgesApiUrl()}/users/${encodeURIComponent(address.toLowerCase())}/badges`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Failed to fetch badges (${response.status})`)
  const body = (await response.json()) as BadgesResponse
  const achieved = body.data?.achieved ?? []
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
