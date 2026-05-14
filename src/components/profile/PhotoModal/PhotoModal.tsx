import { memo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
// eslint-disable-next-line @typescript-eslint/naming-convention
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import { Box, Button, CircularProgress } from 'decentraland-ui2'
import { buildJumpInUrl, buildProfileUrl, formatPhotoDate } from '../../../features/reels'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useReelImageById } from '../../../hooks/useReelImageById'
import {
  CloseButton,
  DialogBody,
  ImagePanel,
  InfoRow,
  MetadataPanel,
  PeopleList,
  PersonAvatar,
  PersonName,
  PersonRow,
  Photo,
  PhotoDialog,
  SceneTitle,
  SectionTitle
} from './PhotoModal.styled'

interface PhotoModalProps {
  imageId: string | null
  onClose: () => void
}

const PhotoModal = memo(({ imageId, onClose }: PhotoModalProps) => {
  const t = useFormatMessage()
  const { image, isLoading } = useReelImageById(imageId ?? undefined)

  return (
    <PhotoDialog open={imageId !== null} onClose={onClose} maxWidth={false} aria-labelledby="photo-modal-title">
      <CloseButton aria-label="Close" onClick={onClose}>
        <CloseIcon />
      </CloseButton>
      <DialogBody>
        <ImagePanel>
          {isLoading || !image ? (
            <CircularProgress sx={{ color: '#fff' }} />
          ) : (
            <Photo src={image.url} alt={image.metadata?.scene?.name ?? 'Snapshot'} loading="lazy" />
          )}
        </ImagePanel>
        <MetadataPanel>
          {image ? (
            <>
              <Box>
                <SectionTitle id="photo-modal-title">{formatPhotoDate(image.metadata.dateTime)}</SectionTitle>
                <SceneTitle>{image.metadata.scene.name}</SceneTitle>
              </Box>
              <InfoRow>
                <LocationOnOutlinedIcon fontSize="small" />
                <span>
                  {image.metadata.scene.location.x}, {image.metadata.scene.location.y}
                </span>
              </InfoRow>
              <Button
                variant="contained"
                color="primary"
                href={buildJumpInUrl(
                  Number(image.metadata.scene.location.x),
                  Number(image.metadata.scene.location.y),
                  image.metadata.realm
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('component.reels.metadata.jump_in')}
              </Button>
              {image.metadata.visiblePeople.length > 0 ? (
                <>
                  <SectionTitle>{t('component.reels.metadata.people')}</SectionTitle>
                  <PeopleList>
                    {image.metadata.visiblePeople.map(person => (
                      <PersonRow key={person.userAddress}>
                        {person.faceUrl ? (
                          <PersonAvatar src={person.faceUrl} alt={person.userName} loading="lazy" />
                        ) : (
                          <PersonAvatar as="div" />
                        )}
                        <a
                          href={buildProfileUrl(person.userAddress)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'none' }}
                        >
                          <PersonName>{person.userName}</PersonName>
                        </a>
                      </PersonRow>
                    ))}
                  </PeopleList>
                </>
              ) : null}
            </>
          ) : null}
        </MetadataPanel>
      </DialogBody>
    </PhotoDialog>
  )
})

export { PhotoModal }
export type { PhotoModalProps }
