import { memo } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import noCameraSrc from '../../../images/reels/no-camera.svg'
import { NotPhotoContainer, NotPhotoSubtitle, NotPhotoTitle } from './NotPhoto.styled'

const NotPhoto = memo(() => {
  const l = useFormatMessage()
  return (
    <NotPhotoContainer>
      <img src={noCameraSrc} alt="" />
      <NotPhotoTitle variant="h1">{l('component.reels.no_photo.title')}</NotPhotoTitle>
      <NotPhotoSubtitle variant="h3">{l('component.reels.no_photo.subtitle')}</NotPhotoSubtitle>
    </NotPhotoContainer>
  )
})

export { NotPhoto }
