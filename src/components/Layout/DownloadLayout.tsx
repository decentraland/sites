import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { Button, Typography, launchDesktopApp, muiIcons, useDesktopMediaQuery } from 'decentraland-ui2'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { DownloadOptions } from '../DownloadOptions'
import { WrapDecentralandText } from '../WrapDecentralandText'
import { DownloadLayoutProps } from './DownloadLayout.types'
import {
  AlreadyDownloadedContainer,
  AlreadyDownloadedLink,
  AlreadyDownloadedText,
  DclLogo,
  DownloadBackgroundOverlay,
  DownloadContainer,
  DownloadImageContainer,
  DownloadOptionsContainer,
  DownloadPageContainer,
  DownloadTitle,
  DownloadWearablePreviewContainer,
  DownloadWearablePreviewOverlay,
  MobileTitle,
  Modal,
  ModalContent,
  ModalIcon,
  ModalTitle,
  ShareButton,
  ShareContainer
} from './DownloadLayout.styled'

const FileDownloadOutlinedIcon = muiIcons.FileDownloadOutlined
const ShareOutlinedIcon = muiIcons.ShareOutlined

const DownloadLayout = memo((props: DownloadLayoutProps) => {
  const { title } = props

  const [openModal, setOpenModal] = useState(false)
  // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-explicit-any
  const [WearablePreviewComponent, setWearablePreviewComponent] = useState<any>(null)

  const l = useFormatMessage()
  const isDesktop = useDesktopMediaQuery()

  const { ref: wearableRef, inView } = useInView({ triggerOnce: true, rootMargin: '200px' })

  const handleJumpIn = useCallback(async () => {
    const hasLauncher = await launchDesktopApp({})
    if (!hasLauncher) {
      setOpenModal(true)
    }
  }, [])

  useEffect(() => {
    if (inView) {
      import('decentraland-ui2/dist/components/WearablePreview/WearablePreview').then(module => {
        setWearablePreviewComponent(() => module.WearablePreview)
      })
    }
  }, [inView])

  const randomDefaultProfile = useMemo(() => {
    return 'default' + (Math.floor(Math.random() * (160 - 1 + 1)) + 1)
  }, [])

  const handleShare = useCallback(() => {
    navigator.share({
      title: 'Download Decentraland',
      text: 'Download Decentraland',
      url: window.location.href
    })
  }, [])

  return (
    <DownloadPageContainer>
      <DownloadBackgroundOverlay />

      <DownloadContainer>
        <DclLogo onClick={() => (window.location.href = 'https://decentraland.org')} />

        {isDesktop && (
          <>
            <AlreadyDownloadedContainer>
              <AlreadyDownloadedText>
                {l('page.download.already_downloaded')}{' '}
                <AlreadyDownloadedLink onClick={handleJumpIn}>{l('page.download.jump_in')}</AlreadyDownloadedLink>
              </AlreadyDownloadedText>
            </AlreadyDownloadedContainer>
            <DownloadOptionsContainer>
              <DownloadTitle variant="h2">
                <WrapDecentralandText text={title} />
              </DownloadTitle>
              <DownloadOptions downloadOnClick />
            </DownloadOptionsContainer>
          </>
        )}

        {!isDesktop && (
          <MobileTitle variant="h2">
            <WrapDecentralandText text={title} />
          </MobileTitle>
        )}

        <DownloadImageContainer>
          <DownloadBackgroundOverlay />
          {!isDesktop && <DownloadWearablePreviewOverlay />}
          <DownloadWearablePreviewContainer ref={wearableRef}>
            {WearablePreviewComponent && (
              <WearablePreviewComponent
                unity
                unityMode="profile"
                profile={randomDefaultProfile}
                disableBackground={true}
                lockBeta={true}
                dev={false}
              />
            )}
          </DownloadWearablePreviewContainer>
        </DownloadImageContainer>
      </DownloadContainer>

      {!isDesktop && typeof navigator !== 'undefined' && !!navigator.share && (
        <ShareContainer>
          <Typography variant="h6">{l('page.download.mobile.switch_to_computer')}</Typography>
          <ShareButton onClick={handleShare} endIcon={<ShareOutlinedIcon />} variant="contained">
            {l('page.download.mobile.send_link')}
          </ShareButton>
        </ShareContainer>
      )}
      <Modal open={openModal} size="tiny">
        <ModalContent>
          <ModalIcon>
            <FileDownloadOutlinedIcon />
          </ModalIcon>
          <ModalTitle>
            {l('page.download.modal.title_first_line')}
            <br />
            {l('page.download.modal.title_second_line')}
          </ModalTitle>
          <Button variant="contained" onClick={() => setOpenModal(false)}>
            {l('page.download.modal.cta')}
          </Button>
        </ModalContent>
      </Modal>
    </DownloadPageContainer>
  )
})

export { DownloadLayout }
