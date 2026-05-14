import { memo, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
// eslint-disable-next-line @typescript-eslint/naming-convention
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import { CircularProgress } from 'decentraland-ui2'
import { buildProfileUrl, formatPhotoDate } from '../../../features/reels'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useReelImageById } from '../../../hooks/useReelImageById'
import { JumpInButton } from '../../jump/JumpInButton'
import { ImageActions } from '../../Reels/ImageActions'
import { UserMetadata } from '../../Reels/Metadata/UserMetadata'
import {
  CloseButton,
  DateLine,
  DialogBody,
  ImagePanel,
  LocationLink,
  LocationRow,
  MetadataHeader,
  MetadataPanel,
  PeopleSection,
  Photo,
  PhotoTakenByLine,
  PhotoTakenByLink,
  SectionTitle,
  SectionTitleRow
} from './PhotoModal.styled'

interface PhotoSurfaceProps {
  imageId: string
  /** When provided, the top-left chevron renders as a back button instead of a close icon — used when this surface is rendered inside another modal (e.g. `ProfileModal`). */
  onBack?: () => void
  /** Always rendered as the top-right close affordance. */
  onClose: () => void
}

const PhotoSurface = memo(({ imageId, onBack, onClose }: PhotoSurfaceProps) => {
  const t = useFormatMessage()
  const { image } = useReelImageById(imageId)
  const [metadataVisible, setMetadataVisible] = useState(true)

  return (
    <>
      <CloseButton aria-label={onBack ? 'Back' : 'Close'} onClick={onBack ?? onClose}>
        {onBack ? <ArrowBackIosNewIcon fontSize="small" /> : <CloseIcon />}
      </CloseButton>
      <DialogBody $metadataVisible={metadataVisible}>
        <ImagePanel>
          {image ? (
            <>
              <ImageActions image={image} metadataVisible={metadataVisible} onToggleMetadata={() => setMetadataVisible(prev => !prev)} />
              <Photo src={image.url} alt={image.metadata?.scene?.name ?? 'Snapshot'} loading="lazy" />
            </>
          ) : (
            <CircularProgress sx={{ color: '#fff' }} />
          )}
        </ImagePanel>
        {image && metadataVisible ? (
          <MetadataPanel>
            <MetadataHeader>
              <SectionTitle id="photo-modal-title">{t('component.reels.metadata.title')}</SectionTitle>
              <DateLine>{formatPhotoDate(image.metadata.dateTime)}</DateLine>
              {image.metadata.userName ? (
                <PhotoTakenByLine>
                  {t('component.reels.metadata.photo_taken_by')}{' '}
                  <PhotoTakenByLink href={buildProfileUrl(image.metadata.userAddress)} target="_blank" rel="noopener noreferrer">
                    {image.metadata.userName}
                  </PhotoTakenByLink>
                </PhotoTakenByLine>
              ) : null}
            </MetadataHeader>
            <SectionTitleRow>{t('component.reels.metadata.place')}</SectionTitleRow>
            <LocationRow>
              <LocationLink>
                <LocationOnOutlinedIcon fontSize="small" />
                <span>
                  {image.metadata.scene.name} {image.metadata.scene.location.x},{image.metadata.scene.location.y}
                </span>
              </LocationLink>
              <JumpInButton
                position={`${image.metadata.scene.location.x},${image.metadata.scene.location.y}`}
                realm={image.metadata.realm}
                size="small"
              />
            </LocationRow>
            {image.metadata.visiblePeople.length > 0 ? (
              <PeopleSection>
                <SectionTitleRow>{t('component.reels.metadata.people')}</SectionTitleRow>
                {image.metadata.visiblePeople.map((user, index) => (
                  <UserMetadata
                    key={user.userAddress || index}
                    user={user}
                    isFirst={index === 0}
                    initialWearableVisibility={index === 0 && (user.wearables?.length ?? 0) > 0}
                  />
                ))}
              </PeopleSection>
            ) : null}
          </MetadataPanel>
        ) : null}
      </DialogBody>
    </>
  )
})

export { PhotoSurface }
export type { PhotoSurfaceProps }
