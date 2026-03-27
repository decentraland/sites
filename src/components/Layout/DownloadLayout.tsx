import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useInView } from 'react-intersection-observer'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
// eslint-disable-next-line @typescript-eslint/naming-convention
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
import { Button, Typography, launchDesktopApp, useDesktopMediaQuery } from 'decentraland-ui2'
import { useGetProfileQuery } from '../../features/profile/profile.client'
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
  PreTitleContainer,
  ShareButton,
  ShareContainer
} from './DownloadLayout.styled'

const DownloadLayout = memo((props: DownloadLayoutProps) => {
  const { title } = props

  const [openModal, setOpenModal] = useState(false)
  // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-explicit-any
  const [WearablePreviewComponent, setWearablePreviewComponent] = useState<any>(null)

  const l = useFormatMessage()
  const isDesktop = useDesktopMediaQuery()

  const searchParams = useMemo(() => new URLSearchParams(window.location.search), [])
  const user = searchParams.get('user')

  const { data: profile } = useGetProfileQuery(user ?? undefined, { skip: !user })
  const profileName = profile?.avatars?.[0]?.name

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
              <PreTitleContainer>
                <CheckCircleIcon htmlColor="#34CE77" fontSize="large" />
                <Typography variant="h4">
                  {l('page.download.pre_title', {
                    name: profileName || l('page.download.your_account')
                  })}
                </Typography>
              </PreTitleContainer>
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
                unityMode="jesus"
                profile={profile?.avatars?.[0]?.ethAddress || randomDefaultProfile}
                disableBackground={true}
                lockBeta={true}
                dev={false}
                baseUrl="https://wearable-preview-git-feat-update-aang-rend-07d7f6-decentraland1.vercel.app/"
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
