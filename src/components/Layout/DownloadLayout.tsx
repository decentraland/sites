import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
// eslint-disable-next-line @typescript-eslint/naming-convention
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { Button, Typography, launchDesktopApp, useDesktopMediaQuery } from 'decentraland-ui2'
import { getEnv } from '../../config/env'
import { useGetProfileQuery } from '../../features/profile/profile.client'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useDownloadClick } from '../../hooks/useDownloadClick'
import { useDownloadPageExit } from '../../hooks/useDownloadPageExit'
import { useSignInRedirect } from '../../hooks/useSignInRedirect'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { DOWNLOAD_URLS } from '../../modules/downloadConstants'
import { DownloadPlace, DownloadTarget, SegmentEvent } from '../../modules/segment'
import { assetUrl } from '../../utils/assetUrl'
import { DownloadOptions } from '../DownloadOptions'
import { GOOGLE_PLAY_MOBILE_URL, googlePlayBadge } from '../Home/shared/googlePlay'
import { GooglePlayButton, GooglePlayImage } from '../Home/shared/MobileCTA.styled'
import { LandingFooter } from '../LandingFooter'
import { LandingNavbarConnected } from '../LandingNavbar'
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
  ShareContainer,
  SignInButton
} from './DownloadLayout.styled'

const DownloadLayout = memo((props: DownloadLayoutProps) => {
  const { title } = props

  const [openModal, setOpenModal] = useState(false)
  // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-explicit-any
  const [WearablePreviewComponent, setWearablePreviewComponent] = useState<any>(null)

  // DownloadLayout only mounts on /download (see src/pages/download.tsx), so
  // this is the correct scope for the download_page_exit abandonment diagnostic.
  useDownloadPageExit()

  const l = useFormatMessage()
  const isDesktop = useDesktopMediaQuery()
  const [, userAgentData] = useAdvancedUserAgentData()
  const isMobileAndroid = !!userAgentData?.mobile && userAgentData.os.name === 'Android'

  // Mobile store CTAs exit to the App Store / Google Play (new tab / app
  // switch). /download is analytics-exempt on cold load (no Segment boot —
  // see isAnalyticsExemptPath), so this click adapter is what carries the
  // partner attribution: analytics-next when Segment is warm (SPA entry),
  // and the unload-safe beacon on cold loads — where Segment may never boot
  // and the user may background the browser for the store app.
  const trackStoreExit = useDownloadClick()

  const { address } = useWalletAddress()

  const [email, user] = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return [params.get('email') || undefined, params.get('user') || undefined]
  }, [])

  // Strip PII from URL so it doesn't leak via Referer header to external resources
  // (e.g. WearablePreview iframe). We already captured the values above via useMemo.
  useEffect(() => {
    if (email || user) {
      const cleanUrl = new URL(window.location.href)
      cleanUrl.searchParams.delete('email')
      cleanUrl.searchParams.delete('user')
      window.history.replaceState(null, '', cleanUrl.toString())
    }
  }, [email, user])

  const profileAddress = user || address
  const isSignedIn = !!profileAddress
  const { data: profile } = useGetProfileQuery(profileAddress ?? undefined, { skip: !profileAddress })
  const profileName = profile?.avatars?.[0]?.name

  const handleSignIn = useSignInRedirect()

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

  return (
    <>
      {/* Signed-in download mirrors the homepage chrome: full navbar (nav links +
          avatar/MANA/notifications). Signed-out keeps the minimal logo + Sign In.
          Forwarding `profileAddress` keeps the navbar's profile query in sync with the
          one this layout already runs (no duplicate request, no stale avatar when the
          page is entered via the `?user=` onboarding deep link). */}
      {isSignedIn && <LandingNavbarConnected address={profileAddress ?? undefined} />}
      <DownloadPageContainer component="main" hasPreview={isSignedIn}>
        <DownloadContainer hasPreview={isSignedIn}>
          {!isSignedIn && (
            <>
              <DclLogo onClick={() => (window.location.href = 'https://decentraland.org')} />
              <SignInButton onClick={handleSignIn}>{l('component.landing.navbar.sign_in')}</SignInButton>
            </>
          )}

          {isDesktop && (
            <>
              <AlreadyDownloadedContainer>
                <AlreadyDownloadedText>
                  {l('page.download.already_downloaded')}{' '}
                  <AlreadyDownloadedLink onClick={handleJumpIn}>{l('page.download.jump_in')}</AlreadyDownloadedLink>
                </AlreadyDownloadedText>
              </AlreadyDownloadedContainer>
              <DownloadOptionsContainer>
                {isSignedIn && (
                  <PreTitleContainer>
                    <CheckCircleIcon htmlColor="#34CE77" fontSize="large" />
                    <Typography variant="h4">
                      {l('page.download.pre_title', {
                        name: profileName || l('page.download.your_account')
                      })}
                    </Typography>
                  </PreTitleContainer>
                )}
                <DownloadTitle variant="h2">{title}</DownloadTitle>
                <DownloadOptions />
              </DownloadOptionsContainer>
            </>
          )}

          {!isDesktop && <MobileTitle variant="h2">{title}</MobileTitle>}

          {isSignedIn && (
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
                    // Drive the preview off the known address (available synchronously when
                    // signed in) instead of the async profile query — otherwise the first
                    // render falls back to a random default avatar until the query resolves.
                    profile={profileAddress || randomDefaultProfile}
                    disableBackground={true}
                    lockBeta={true}
                    dev={false}
                    baseUrl={getEnv('WEARABLE_PREVIEW_URL')}
                  />
                )}
              </DownloadWearablePreviewContainer>
            </DownloadImageContainer>
          )}
        </DownloadContainer>

        {!isDesktop && (
          <ShareContainer>
            {/* `GooglePlayButton` / `GooglePlayImage` are generic store-badge styled components
                (same anchor + image sizing for the Apple and Google badges); the name is
                historical from when they were Google-Play–only. Reused here for both OSes. */}
            {isMobileAndroid ? (
              <GooglePlayButton
                href={GOOGLE_PLAY_MOBILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-place={DownloadPlace.DOWNLOAD_PAGE}
                data-event={SegmentEvent.DOWNLOAD}
                data-os="Android"
                data-download-target={DownloadTarget.GOOGLE_PLAY}
                onClick={trackStoreExit}
              >
                <GooglePlayImage src={googlePlayBadge} alt="Get it on Google Play" />
              </GooglePlayButton>
            ) : (
              <GooglePlayButton
                href={DOWNLOAD_URLS.appStore}
                target="_blank"
                rel="noopener noreferrer"
                data-place={DownloadPlace.DOWNLOAD_PAGE}
                data-event={SegmentEvent.DOWNLOAD}
                data-os="iOS"
                data-download-target={DownloadTarget.APP_STORE}
                onClick={trackStoreExit}
              >
                <GooglePlayImage src={assetUrl('/download-on-the-app-store.svg')} alt="Download on the App Store" />
              </GooglePlayButton>
            )}
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
