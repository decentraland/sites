import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { normalizeJumpPlace } from '../components/whats-on/PlaceDetailModal'
import type { ModalPlaceData } from '../components/whats-on/PlaceDetailModal'
import { isEns, parsePosition, useGetJumpPlacesQuery } from '../features/experiences/jump'
import { PLACE_POSITION_PARAM, PLACE_WORLD_PARAM } from '../utils/whatsOnUrl'
import { isClientError } from './deepLinkErrors'

interface UsePlaceDeepLinkResult {
  modalData: ModalPlaceData | null
  isOpen: boolean
  closeDeepLink: () => void
}

// Bare names like `brai` are expanded to `brai.dcl.eth` so legacy
// share links (`?world=brai`) keep resolving. Lowercased so `Brai` and
// `brai` produce the same RTK Query cache key (the API treats them
// equivalently and lowercases internally).
function expandWorldParam(value: string): string | null {
  const lower = value.toLowerCase()
  const expanded = lower.endsWith('.eth') ? lower : `${lower}.dcl.eth`
  return isEns(expanded) ? expanded : null
}

function usePlaceDeepLink(): UsePlaceDeepLinkResult {
  const [searchParams, setSearchParams] = useSearchParams()
  const positionParam = searchParams.get(PLACE_POSITION_PARAM)
  const worldParam = searchParams.get(PLACE_WORLD_PARAM)

  const queryArg = useMemo(() => {
    if (worldParam) {
      const realm = expandWorldParam(worldParam)
      if (realm) return { realm }
    }
    if (positionParam) {
      const parsed = parsePosition(positionParam)
      if (parsed.isValid) return { position: parsed.coordinates }
    }
    return null
  }, [positionParam, worldParam])

  const { data: places, error } = useGetJumpPlacesQuery(queryArg ?? skipToken)

  const modalData = useMemo<ModalPlaceData | null>(() => {
    const place = places?.[0]
    return place ? normalizeJumpPlace(place) : null
  }, [places])

  const closeDeepLink = useCallback(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete(PLACE_POSITION_PARAM)
        next.delete(PLACE_WORLD_PARAM)
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  useEffect(() => {
    if (queryArg && isClientError(error)) closeDeepLink()
  }, [queryArg, error, closeDeepLink])

  return {
    modalData,
    isOpen: Boolean(queryArg && modalData),
    closeDeepLink
  }
}

export { usePlaceDeepLink }
