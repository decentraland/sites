import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useAsyncMemo } from '@dcl/hooks'
import { Button, Typography, launchDesktopApp, muiIcons, useDesktopMediaQuery } from 'decentraland-ui2'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import backgroundImage from '../../images/download/download_background.webp'
import { ExplorerDownloads } from '../../modules/explorerDownloads'
import { formatToShorthand } from '../../modules/number'
import { normalizeUserAgentArchitectureByOs } from '../../modules/userAgent'
import backgroundVideo from '../../videos/download_background.webm'
import { DownloadOptions } from '../Landing/DownloadOptions/DownloadOptions'
import { OperativeSystem } from '../Landing/DownloadOptions/DownloadOptions.types'
import { WrapDecentralandText } from '../WrapDecentralandText'
import { DownloadLayoutProps } from './DownloadLayout.types'
import {
  AlreadyDownloadedContainer,
  AlreadyDownloadedLink,
  AlreadyDownloadedText,
  DclLogo,
  DownloadContainer,
  DownloadImageContainer,
  DownloadOptionsContainer,
  DownloadPageContainer,
  DownloadVideo,
  DownloadVideoOverlay,
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
  const { userAgentData, title, links, redirectPath } = props

  const [isClient, setIsClient] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-explicit-any
  const [WearablePreviewComponent, setWearablePreviewComponent] = useState<any>(null)

  const l = useFormatMessage()
  const isDesktop = useDesktopMediaQuery()

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const os = searchParams?.get('os')

  const handleJumpIn = useCallback(async () => {
    const hasLauncher = await launchDesktopApp({})
    if (!hasLauncher) {
      setOpenModal(true)
    }
  }, [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      import('decentraland-ui2/dist/components/WearablePreview/WearablePreview').then(module => {
        setWearablePreviewComponent(() => module.WearablePreview)
      })
    }
  }, [isClient])

  const randomDefaultProfile = useMemo(() => {
    return 'default' + (Math.floor(Math.random() * (160 - 1 + 1)) + 1)
  }, [])

  useEffect(() => {
    if (userAgentData && os) {
      normalizeUserAgentArchitectureByOs(userAgentData, os as OperativeSystem)
    }
  }, [userAgentData, os])

  const [downloads, downloadsStatus] = useAsyncMemo(async () => ExplorerDownloads.get().getTotalDownloads(), [])

  const handleShare = useCallback(() => {
    navigator.share({
      title: 'Download Decentraland',
      text: 'Download Decentraland',
      url: window.location.href
    })
  }, [])

  return (
    <DownloadPageContainer>
      <DownloadVideo src={backgroundVideo} poster={backgroundImage} autoPlay muted loop playsInline={true} />

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
              <DownloadOptions
                userAgentData={userAgentData}
                links={links}
                title={title}
                redirectPath={redirectPath}
                hideLogo
                downloadCounts={!downloadsStatus.loading && downloadsStatus.loaded ? formatToShorthand(downloads || 0) : undefined}
              />
            </DownloadOptionsContainer>
          </>
        )}

        {!isDesktop && (
          <MobileTitle variant="h2">
            <WrapDecentralandText text={title} />
          </MobileTitle>
        )}

        <DownloadImageContainer>
          <DownloadVideoOverlay />
          {!isDesktop && <DownloadWearablePreviewOverlay />}
          <DownloadWearablePreviewContainer>
            {isClient && WearablePreviewComponent && (
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
