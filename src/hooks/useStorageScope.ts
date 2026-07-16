import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { isEns } from '../features/places/places.helpers'
import { useGetWorldScenesQuery } from '../features/storage'

interface StorageScope {
  realm: string | null
  position: string | null
  // World realm with no explicit URL position whose base parcel is still being
  // fetched from the Worlds Content Server. Callers gate their requests on this so
  // no read/write fires before the base is known.
  isResolving: boolean
  // World realm with no explicit URL position whose scene list errored or came back
  // empty, so no base parcel can be derived. The storage-service treats an ABSENT
  // parcel as `0,0`, so callers MUST block the request rather than fall through.
  unresolved: boolean
}

function useStorageScope(): StorageScope {
  const [searchParams] = useSearchParams()
  const realm = searchParams.get('realm')
  const urlPosition = searchParams.get('position')

  // Only Worlds (ENS realms) need a resolved base parcel — genesis-city lands always
  // carry their parcel in the URL. Resolve only when the URL has no explicit position;
  // an explicit dropdown scene pick (which writes `?position=`) stays authoritative.
  const isWorld = isEns(realm ?? undefined)
  const needsResolution = isWorld && !urlPosition

  const { data: scenes, isError } = useGetWorldScenesQuery({ worldName: realm ?? '' }, { skip: !needsResolution })

  return useMemo(() => {
    // Derive, never store: recomputed on every URL/scene change, so switching parcels
    // can't reuse a stale base. The URL value always wins via `urlPosition ?? …`.
    const resolvedBase = scenes && scenes.length > 0 ? scenes[0].baseParcel : null
    const position = urlPosition ?? (needsResolution ? resolvedBase : null)
    // Still fetching: a world needs a base, none is known yet, and no error yet.
    const isResolving = needsResolution && position === null && scenes === undefined && !isError
    // Resolution finished with nothing usable (errored or empty) — block instead of
    // falling back to 0,0. A resolved base (cached or fresh) sets `position`, so a
    // background refetch error can never hide a base we already have.
    const unresolved = needsResolution && position === null && (isError || scenes?.length === 0)
    return { realm, position, isResolving, unresolved }
  }, [realm, urlPosition, needsResolution, scenes, isError])
}

export { useStorageScope }
export type { StorageScope }
