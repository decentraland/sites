import { memo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAnalytics } from '@dcl/hooks'
import { NotPhoto } from '../../components/Reels/NotPhoto'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useReelImagesByUser } from '../../hooks/useReelImagesByUser'
import { SegmentEvent } from '../../modules/segment'
import { ListContainer, ListGrid, ListItem, ListTitle } from './ReelsListPage.styled'

const ReelsListPage = memo(() => {
  const { address } = useParams<{ address: string }>()
  const navigate = useNavigate()
  const { track } = useAnalytics()
  const l = useFormatMessage()
  const { images, isLoading, error } = useReelImagesByUser(address, { limit: 24, offset: 0 })

  useEffect(() => {
    const previous = document.title
    document.title = address ? `Reels by ${address}` : 'Decentraland Reels'
    return () => {
      document.title = previous
    }
  }, [address])

  if (!isLoading && (error || images.length === 0)) {
    return <NotPhoto />
  }

  const userName = images[0]?.metadata.visiblePeople[0]?.userName ?? address ?? ''

  return (
    <ListContainer>
      <ListTitle variant="h2">{l('component.reels.list.title', { userName })}</ListTitle>
      <ListGrid>
        {images.map(image => (
          <ListItem
            key={image.id}
            role="button"
            tabIndex={0}
            onClick={() => {
              track(SegmentEvent.REELS_CLICK_THUMBNAIL, { imageId: image.id })
              navigate(`/reels/${image.id}`)
            }}
          >
            <img src={image.thumbnailUrl || image.url} alt="" loading="lazy" />
          </ListItem>
        ))}
      </ListGrid>
    </ListContainer>
  )
})

export { ReelsListPage }
