import { useCallback } from 'react'
import { useAnalytics } from '@dcl/hooks'
import type { SegmentEvent } from '../modules/segment.types'
import { useAuthIdentity } from './useAuthIdentity'
import { useStorageScope } from './useStorageScope'

type StorageTrackFn = (event: SegmentEvent, extras?: Record<string, unknown>) => void

function useStorageTrack(): StorageTrackFn {
  const { track } = useAnalytics()
  const { realm, position } = useStorageScope()
  const { address } = useAuthIdentity()

  return useCallback(
    (event, extras) => {
      track(event, {
        realmName: realm ?? undefined,
        parcel: position ?? undefined,
        address,
        ...extras
      })
    },
    [track, realm, position, address]
  )
}

export { useStorageTrack }
export type { StorageTrackFn }
