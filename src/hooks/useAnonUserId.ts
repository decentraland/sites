import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Returns the anonymous user ID for campaign attribution.
 * Priority: URL param > Segment anonymous ID
 * The URL param is used for re-download flows (/download_success page)
 * The Segment ID is the primary source on the initial download page
 */
export function useAnonUserId(): string | undefined {
  const [searchParams] = useSearchParams()

  return useMemo(() => {
    const fromUrl = searchParams.get('anon_user_id')
    if (fromUrl) {
      return fromUrl
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const segmentId = (window as any).analytics?.user?.()?.anonymousId?.()
    return segmentId ?? undefined
  }, [searchParams])
}
