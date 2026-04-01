import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
// eslint-disable-next-line @typescript-eslint/naming-convention
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
import { useWalletState } from '@dcl/core-web3/lazy'
import { Button, Typography, launchDesktopApp, useDesktopMediaQuery } from 'decentraland-ui2'
import { getEnv } from '../../config/env'
import { useGetProfileQuery } from '../../features/profile/profile.client'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { DownloadOptions } from '../DownloadOptions'
import { LandingFooter } from '../LandingFooter'
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
  DownloadTitle,
  DownloadWearablePreviewContainer,
  DownloadWearablePreviewOverlay,
  FooterWrapper,
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

  const { address } = useWalletState()

  const searchParams = useMemo(() => new URLSearchParams(window.location.search), [])
  const user = searchParams.get('user')

  const profileAddress = user || address
  const { data: profile } = useGetProfileQuery(profileAddress ?? undefined, { skip: !profileAddress })
  const profileName = profile?.avatars?.[0]?.name

  const wearableContainerRef = useRef<HTMLDivElement | null>(null)
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

  useEffect(() => {
    if (!WearablePreviewComponent) return
    const container = wearableContainerRef.current
    if (!container) return

    const setIframeTitle = (iframe: HTMLIFrameElement) => {
      if (!iframe.title) {
        iframe.title = l('page.download.avatar_preview')
      }
    }

    const existing = container.querySelector<HTMLIFrameElement>('iframe')
    if (existing) {
      setIframeTitle(existing)
      return
    }

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLIFrameElement) {
            setIframeTitle(node)
            observer.disconnect()
            return
          }
          if (node instanceof HTMLElement) {
            const iframe = node.querySelector<HTMLIFrameElement>('iframe')
            if (iframe) {
              setIframeTitle(iframe)
              observer.disconnect()
              return
            }
          }
        }
      }
    })

    observer.observe(container, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [WearablePreviewComponent, l])

  const randomDefaultProfile = useMemo(() => {
    return 'default' + (Math.floor(Math.random() * (160 - 1 + 1)) + 1)
  }, [])

  const handleShare = useCallback(() => {
    navigator.share({
      title: l('page.download.share_title'),
      text: l('page.download.share_title'),
      url: window.location.href
    })
  }, [l])

  return (
    <>
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
                <DownloadOptions />
              </DownloadOptionsContainer>
            </>
          )}

          {!isDesktop && (
            <MobileTitle variant="h2">
              <WrapDecentralandText text={title} />
            </MobileTitle>
          )}

          <DownloadImageContainer>
            {!isDesktop && <DownloadWearablePreviewOverlay />}
            <DownloadWearablePreviewContainer
              ref={(node: HTMLDivElement | null) => {
                wearableRef(node)
                wearableContainerRef.current = node
              }}
            >
              {WearablePreviewComponent && (
                <WearablePreviewComponent
                  unity
                  unityMode="jesus"
                  profile={profile?.avatars?.[0]?.ethAddress || randomDefaultProfile}
                  disableBackground={true}
                  lockBeta={true}
                  dev={false}
                  baseUrl={getEnv('WEARABLE_PREVIEW_URL')}
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
      <FooterWrapper>
        <LandingFooter />
      </FooterWrapper>
    </>
  )
})

export { DownloadLayout }
