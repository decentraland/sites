import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { normalizeJumpPlace } from '../components/whats-on/PlaceDetailModal'
import type { ModalPlaceData } from '../components/whats-on/PlaceDetailModal'
import { isEns, parsePosition, useGetJumpPlacesQuery } from '../features/jump'
import { PLACE_POSITION_PARAM, PLACE_WORLD_PARAM } from '../utils/whatsOnUrl'

interface UsePlaceDeepLinkResult {
  modalData: ModalPlaceData | null
  isOpen: boolean
  closeDeepLink: () => void
}

function isClientError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const status = (error as { status?: unknown }).status
  return typeof status === 'number' && status >= 400 && status < 500
}

function usePlaceDeepLink(): UsePlaceDeepLinkResult {
  const [searchParams, setSearchParams] = useSearchParams()
  const positionParam = searchParams.get(PLACE_POSITION_PARAM)
  const worldParam = searchParams.get(PLACE_WORLD_PARAM)

  const queryArg = useMemo(() => {
    if (worldParam && isEns(worldParam)) return { realm: worldParam }
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
