/* eslint-disable @typescript-eslint/naming-convention */
import { useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatedBackground } from 'decentraland-ui2'
import { ResponsiveCard } from '../../components/jump/ResponsiveCard'
import {
  DEFAULT_POSITION,
  DEFAULT_REALM,
  buildGenericPlace,
  fromPlace,
  parsePosition,
  useGetJumpPlacesQuery,
  useGetSceneMetadataQuery
} from '../../features/jump'
import type { Creator } from '../../features/jump/jump.types'
import { JumpPageContainer, JumpPageContent } from './PageContainer.styled'

const PlacesPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const positionParam = searchParams.get('position') ?? DEFAULT_POSITION
  const realmParam = searchParams.get('realm') ?? DEFAULT_REALM
  const parsedPosition = useMemo(() => parsePosition(positionParam), [positionParam])

  const realm = realmParam === DEFAULT_REALM ? undefined : realmParam

  const placesQuery = useGetJumpPlacesQuery({ position: parsedPosition.coordinates, realm })
  const sceneMetadataQuery = useGetSceneMetadataQuery({ position: parsedPosition.coordinates.join(',') })

  useEffect(() => {
    if (placesQuery.isError) {
      navigate('/jump/places/invalid')
    }
  }, [placesQuery.isError, navigate])

  const cardData = useMemo(() => {
    if (!placesQuery.data) return undefined
    if (placesQuery.data.length === 0) {
      return buildGenericPlace({ coordinates: parsedPosition.coordinates, realm })
    }
    return fromPlace(placesQuery.data[0])
  }, [placesQuery.data, parsedPosition.coordinates, realm])

  const creator: Creator | undefined = useMemo(() => {
    const info = sceneMetadataQuery.data
    if (!info) return undefined
    return {
      user: info.deployerAddress,
      user_name: info.deployerName,
      avatar: info.deployerAvatar
    }
  }, [sceneMetadataQuery.data])

  return (
    <JumpPageContainer>
      <AnimatedBackground variant="fixed" />
      <JumpPageContent>
        <ResponsiveCard data={cardData} isLoading={placesQuery.isLoading} creator={creator} />
      </JumpPageContent>
    </JumpPageContainer>
  )
}

export { PlacesPage }
