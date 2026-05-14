import { memo, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
// eslint-disable-next-line @typescript-eslint/naming-convention
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import { Box, CircularProgress } from 'decentraland-ui2'
import { buildJumpInUrl, buildProfileUrl, formatPhotoDate } from '../../../features/reels'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useReelImageById } from '../../../hooks/useReelImageById'
import { ImageActions } from '../../Reels/ImageActions'
import { UserMetadata } from '../../Reels/Metadata/UserMetadata'
import {
  CloseButton,
  DateLine,
  DialogBody,
  ImagePanel,
  JumpInLink,
  LocationLink,
  LocationRow,
  MetadataHeader,
  MetadataPanel,
  PeopleSection,
  Photo,
  PhotoDialog,
  SectionTitle
} from './PhotoModal.styled'

interface PhotoModalProps {
  imageId: string | null
  onClose: () => void
}

const PhotoModal = memo(({ imageId, onClose }: PhotoModalProps) => {
  const t = useFormatMessage()
  const { image, isLoading } = useReelImageById(imageId ?? undefined)
  // `ImageActions` already toggles the metadata visibility flag via its `i` button —
  // we surface the state so users can collapse the right panel and expand the image.
  const [metadataVisible, setMetadataVisible] = useState(true)

  return (
    <PhotoDialog open={imageId !== null} onClose={onClose} maxWidth={false} aria-labelledby="photo-modal-title">
      <CloseButton aria-label="Close" onClick={onClose}>
        <CloseIcon />
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
                <Box sx={{ color: '#fcfcfc', fontSize: 14, mt: 0.5 }}>
                  {t('component.reels.metadata.photo_taken_by')}{' '}
                  <a
                    href={buildProfileUrl(image.metadata.userAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#57C2FF', textDecoration: 'none', marginLeft: 4 }}
                  >
                    {image.metadata.userName}
                  </a>
                </Box>
              ) : null}
            </MetadataHeader>
            <SectionTitle>{t('component.reels.metadata.place')}</SectionTitle>
            <LocationRow>
              <LocationLink>
                <LocationOnOutlinedIcon fontSize="small" />
                <span>
                  {image.metadata.scene.name} {image.metadata.scene.location.x},{image.metadata.scene.location.y}
                </span>
              </LocationLink>
              <JumpInLink
                href={buildJumpInUrl(
                  Number(image.metadata.scene.location.x),
                  Number(image.metadata.scene.location.y),
                  image.metadata.realm
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('component.reels.metadata.jump_in')}
              </JumpInLink>
            </LocationRow>
            {image.metadata.visiblePeople.length > 0 ? (
              <PeopleSection>
                <SectionTitle>{t('component.reels.metadata.people')}</SectionTitle>
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
      {isLoading && image ? null : null}
    </PhotoDialog>
  )
})

export { PhotoModal }
export type { PhotoModalProps }
