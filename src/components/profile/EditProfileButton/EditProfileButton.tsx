// eslint-disable-next-line @typescript-eslint/naming-convention
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { DownloadModal } from 'decentraland-ui2'
import { DEFAULT_POSITION } from '../../../features/places/places.helpers'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useLaunchExplorer } from '../../../hooks/useLaunchExplorer'
import { EditButton, EditButtonIcon } from './EditProfileButton.styled'

/**
 * "EDIT" CTA pinned to the top-right of the own-profile Badges/About/Links card
 * (Figma 322:49174, "edit CTAS"). Avatar/profile editing only exists in-world, so the
 * button launches the explorer exactly like JUMP IN does (deep link via
 * `launchDesktopApp`, download fallback when the client isn't installed).
 */
function EditProfileButton() {
  const t = useFormatMessage()
  const { launchExplorer, isMobile, isDownloadModalOpen, closeDownloadModal, downloadModalProps } = useLaunchExplorer({
    position: DEFAULT_POSITION
  })

  return (
    <>
      <EditButton onClick={launchExplorer}>
        {t('profile.header.edit')}
        <EditButtonIcon>
          <EditOutlinedIcon />
        </EditButtonIcon>
      </EditButton>
      {!isMobile && <DownloadModal open={isDownloadModalOpen} onClose={closeDownloadModal} {...downloadModalProps} />}
    </>
  )
}

export { EditProfileButton }
