import { useCallback } from 'react'
import { useAnalytics } from '@dcl/hooks'
import { SegmentEvent } from '../../modules/segment'

export function useTrackClick() {
  const { isInitialized, track } = useAnalytics()
  return useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!isInitialized) return
      const element = event.currentTarget
      const payload: Record<string, string | null> = {}

      Array.from(element.attributes).forEach((attr) => {
        if (attr.name.startsWith('data-')) {
          const key = attr.name
            .slice(5)
            .split('-')
            .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
            .join('')
          payload[key] = attr.value
        }
      })

      track(SegmentEvent.Click, payload)
    },
    [isInitialized, track]
  )
}
