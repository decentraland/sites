import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAdvancedUserAgentData, useAsyncMemo } from '@dcl/hooks'
import { DownloadModal, DownloadQRModal } from 'decentraland-ui2'
import { heroContent } from '../../../data/static-content'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { useAnimatedCounter } from '../../../hooks/useAnimatedCounter'
import { useHangOutAction } from '../../../hooks/useHangOutAction'
import appleLogo from '../../../images/apple-logo.svg'
import microsoftLogo from '../../../images/microsoft-logo.svg'
import { DOWNLOAD_URLS } from '../../../modules/downloadConstants'
import { ExplorerDownloads } from '../../../modules/explorerDownloads'
import { formatToShorthand } from '../../../modules/number'
import { SectionViewedTrack } from '../../../modules/segment'
import { OperativeSystem } from '../../../types/download.types'
import { assetUrl } from '../../../utils/assetUrl'
import { VerifiedIcon } from '../../Icon/VerifiedIcon'
import { GOOGLE_PLAY_MOBILE_URL, googlePlayBadge } from '../shared/googlePlay'
import {
  DownloadButton,
  EpicButton,
  GooglePlayButton,
  GooglePlayImage,
  GradientBottom,
  GradientTop,
  HeroBackground,
  HeroCTAWrapper,
  HeroContainer,
  HeroContent,
  HeroDownloadCounts,
  HeroDownloadInfo,
  HeroPlatformIcon,
  HeroPlatformIcons,
  HeroPlatformSeparator,
  MobileHeroContent,
  MobileHeroSubtitle,
  MobileHeroTitle
} from './Hero.styled'

const heroImageDesktop = assetUrl('/hero_desktop.webp')
const heroImageTablet = assetUrl('/hero_tablet.webp')
const heroImageMobile = assetUrl('/hero_mobile.webp')

const imageByOs: Record<string, string> = {
  [OperativeSystem.WINDOWS]: microsoftLogo,
  [OperativeSystem.MACOS]: appleLogo
}

// Module-level cache for download counts — survives component remounts.
let cachedDownloadCounts: string | null = null

const Hero = memo(({ isDesktop }: { isDesktop: boolean }) => {
  const [, userAgentData] = useAdvancedUserAgentData()
  const l = useFormatMessage()
  const onClickHandle = useTrackClick()
  const { isDownloadModalOpen, closeDownloadModal, downloadModalProps, totalDownloads } = useHangOutAction()

  const [rawDownloads, rawDownloadsStatus] = useAsyncMemo(async () => ExplorerDownloads.get().getTotalDownloads(), [])

  const targetDownloads = !rawDownloadsStatus.loading && rawDownloadsStatus.loaded && rawDownloads ? rawDownloads : null
  if (targetDownloads) cachedDownloadCounts = formatToShorthand(targetDownloads)
  const animatedDownloads = useAnimatedCounter(targetDownloads)
  const downloadCountsFormatted = useMemo(
    () => (animatedDownloads ? formatToShorthand(animatedDownloads) : cachedDownloadCounts ?? '+400K'),
    [animatedDownloads]
  )

  const osImage = userAgentData ? imageByOs[userAgentData.os.name] : null
  const currentOs = userAgentData?.os.name
  const isMobileAndroid = !!userAgentData?.mobile && currentOs === 'Android'

  // Mobile download modal state (for iOS and Google Play icon clicks)
  const [mobileModalOs, setMobileModalOs] = useState<'ios' | 'android' | null>(null)

  // LCP-critical pieces of state:
  //   - The <picture>/<img> is always rendered so Chrome's LCP observer anchors
  //     on a stable image element from the first paint onward. Never replaced.
  //   - The animated desktop background <video> fades in on top as an overlay
  //     only after the page is idle, so it never competes for LCP tracking.
  const [loadVideo, setLoadVideo] = useState(false)
  const heroBackgroundRef = useRef<HTMLDivElement | null>(null)

  // Fade out the prerendered hero shell once React's hero image is painted.
  // We deliberately do NOT remove the shell from the DOM: removing the LCP
  // element invalidates Chrome's LCP bookkeeping and causes re-election on a
  // smaller later element (e.g. the <h2> below, which pushed LCP to 2.1s).
  useEffect(() => {
    document.documentElement.style.setProperty('--hero-vh', `${window.innerHeight * 0.01}px`)

    const shell = document.getElementById('hero-shell')
    const shellNav = document.getElementById('hero-shell-nav')

    const hideShell = () => {
      if (shell) {
        shell.style.transition = 'opacity 200ms ease-out'
        shell.style.opacity = '0'
        shell.style.pointerEvents = 'none'
      }
      shellNav?.remove()
    }

    // Delay the fade so Chrome has multiple frames to register the shell image
    // as an LCP candidate before its ancestor's opacity reaches 0 (Chrome excludes
    // images inside opacity:0 ancestors from LCP tracking).
    const img = heroBackgroundRef.current?.querySelector<HTMLImageElement>('img')
    const armFade = () => {
      window.setTimeout(hideShell, 500)
    }
    if (img?.complete) {
      armFade()
    } else if (img) {
      img.addEventListener('load', armFade, { once: true })
      img.addEventListener('error', armFade, { once: true })
    }

    // Load the background video only after the page is idle, and only on
    // desktop. Delayed long enough that Chrome has committed its LCP entry on
    // the static image before the video element joins the DOM.
    if (!isDesktop) return
    const useIdle = typeof window.requestIdleCallback === 'function'
    const handle = useIdle
      ? window.requestIdleCallback(() => setLoadVideo(true), { timeout: 4000 })
      : window.setTimeout(() => setLoadVideo(true), 3000)
    return () => {
      if (useIdle && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(handle)
      } else {
        window.clearTimeout(handle)
      }
    }
  }, [isDesktop])

  const handleDownloadClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      onClickHandle(e)
      if (userAgentData) {
        window.location.href = `/download_success?os=${userAgentData.os.name}`
      }
    },
    [onClickHandle, userAgentData]
  )

  return (
    <HeroContainer>
      <HeroBackground ref={heroBackgroundRef}>
        <img
          className="hero-image"
          src={isDesktop ? heroImageDesktop : heroImageMobile}
          srcSet={`${heroImageMobile} 800w, ${heroImageTablet} 1200w, ${heroImageDesktop} 1920w`}
          sizes="100vw"
          alt="Decentraland — a virtual world to hang out online"
          width={1920}
          height={1080}
          fetchPriority="high"
          decoding="sync"
        />
        {isDesktop && loadVideo && (
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="hero-video-overlay"
            onCanPlay={e => e.currentTarget.setAttribute('data-ready', 'true')}
          >
            <source src={heroContent.backgroundVideoWebm} type="video/webm" />
            <source src={heroContent.backgroundVideoMp4} type="video/mp4" />
          </video>
        )}
      </HeroBackground>
      <GradientTop />
      <GradientBottom />

      {/* Mobile Android */}
      {!isDesktop && isMobileAndroid && (
        <MobileHeroContent>
          <MobileHeroTitle>{l('page.home.hero.mobile_android_title')}</MobileHeroTitle>
          <MobileHeroSubtitle>{l('page.home.hero.mobile_android_subtitle')}</MobileHeroSubtitle>
          <GooglePlayButton href={GOOGLE_PLAY_MOBILE_URL} target="_blank" rel="noopener noreferrer">
            <GooglePlayImage src={googlePlayBadge} alt="Get it on Google Play" />
          </GooglePlayButton>
        </MobileHeroContent>
      )}

      {/* Mobile iOS / default */}
      {!isDesktop && !isMobileAndroid && (
        <MobileHeroContent>
          <MobileHeroTitle>{l('page.home.hero.mobile_android_title')}</MobileHeroTitle>
          <MobileHeroSubtitle>{l('page.home.hero.mobile_android_subtitle')}</MobileHeroSubtitle>
          <GooglePlayButton href={DOWNLOAD_URLS.appStore} target="_blank" rel="noopener noreferrer">
            <GooglePlayImage src={assetUrl('/download-on-the-app-store.svg')} alt="Download on the App Store" />
          </GooglePlayButton>
        </MobileHeroContent>
      )}

      {/* Desktop */}
      {isDesktop && (
        <HeroContent>
          {/* Hero title is rendered by the prerendered shell so it is present at FCP
              and Chrome's LCP observer anchors on that element rather than on a
              React-rendered h2 that paints ~100ms later. */}

          <HeroCTAWrapper>
            {/* Download + Epic buttons */}
            <DownloadButton
              href={userAgentData ? `/download_success?os=${userAgentData.os.name}` : '/download'}
              data-place={SectionViewedTrack.LANDING_HERO}
              data-event="click"
              onClick={handleDownloadClick}
            >
              {l('page.download.download_for_short')}
              {osImage ? (
                <img src={osImage} alt={userAgentData?.os.name ?? ''} style={{ filter: 'brightness(0) invert(1)' }} />
              ) : (
                <span style={{ display: 'block', width: 32, height: 32, flexShrink: 0 }} />
              )}
            </DownloadButton>

            <EpicButton href={DOWNLOAD_URLS.epic} target="_blank" rel="noopener noreferrer">
              {l('page.download.download_on')}
              <img src={assetUrl('/epic_icon.svg')} alt="Epic Games" style={{ filter: 'brightness(0)' }} />
            </EpicButton>
          </HeroCTAWrapper>

          {/* Download counts + platform icons */}
          <HeroDownloadInfo>
            <HeroDownloadCounts variant="body1">
              <VerifiedIcon /> {l('page.download.total_downloads', { downloads: downloadCountsFormatted })}
            </HeroDownloadCounts>
            <HeroPlatformSeparator />
            <HeroPlatformIcons>
              {currentOs === OperativeSystem.MACOS && (
                <a href="/download_success?os=Windows">
                  <HeroPlatformIcon src={microsoftLogo} alt="Windows" />
                </a>
              )}
              {currentOs === OperativeSystem.WINDOWS && (
                <a href="/download_success?os=macOS">
                  <HeroPlatformIcon src={appleLogo} alt="macOS" />
                </a>
              )}
              {!currentOs && <span style={{ display: 'inline-block', width: 24, height: 24 }} />}
            </HeroPlatformIcons>
            <HeroPlatformIcons>
              <a
                href="#"
                onClick={e => {
                  e.preventDefault()
                  setMobileModalOs('ios')
                }}
              >
                <HeroPlatformIcon src={assetUrl('/ios-logo.svg')} alt="iOS" />
              </a>
            </HeroPlatformIcons>
            <HeroPlatformIcons>
              <a
                href="#"
                onClick={e => {
                  e.preventDefault()
                  setMobileModalOs('android')
                }}
              >
                <HeroPlatformIcon src={assetUrl('/google_play_icon.svg')} alt="Android" />
              </a>
            </HeroPlatformIcons>
          </HeroDownloadInfo>
        </HeroContent>
      )}

      {/* Download modal for "Hang Out Now" / "Jump In" buttons */}
      <DownloadModal open={isDownloadModalOpen} onClose={closeDownloadModal} {...downloadModalProps} />

      {/* QR modal for platform icon clicks (iOS/Android) */}
      {mobileModalOs && (
        <DownloadQRModal
          open
          onClose={() => setMobileModalOs(null)}
          os={mobileModalOs}
          i18n={{ totalDownloads: `Total Downloads: ${totalDownloads}` }}
        />
      )}
    </HeroContainer>
  )
})

Hero.displayName = 'Hero'

export { Hero }
