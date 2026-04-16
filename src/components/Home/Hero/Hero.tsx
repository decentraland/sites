import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useAdvancedUserAgentData, useAsyncMemo } from '@dcl/hooks'
import { DownloadModal, DownloadQRModal } from 'decentraland-ui2'
import { heroContent } from '../../../data/static-content'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { useAnimatedCounter } from '../../../hooks/useAnimatedCounter'
import { useHangOutAction } from '../../../hooks/useHangOutAction'
import { useShareAction } from '../../../hooks/useShareAction'
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
import { ShareIcon } from '../shared/ShareIcon'
import {
  AppleIcon,
  ComingSoonRow,
  ComingSoonText,
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
  HeroTitle,
  MobileHeroContent,
  MobileHeroSubtitle,
  MobileHeroTitle,
  SendLinkButton
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

  // Remove the prerendered hero shell now that React's Hero has mounted.
  useEffect(() => {
    document.getElementById('hero-shell')?.remove()
    document.getElementById('hero-shell-nav')?.remove()
    document.documentElement.style.setProperty('--hero-vh', `${window.innerHeight * 0.01}px`)
  }, [])

  const handleShareClick = useShareAction()

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
      <HeroBackground>
        {isDesktop ? (
          <video autoPlay loop muted playsInline poster={heroImageDesktop} preload="metadata">
            <source src={heroContent.backgroundVideoWebm} type="video/webm" />
            <source src={heroContent.backgroundVideoMp4} type="video/mp4" />
          </video>
        ) : (
          <picture>
            <source srcSet={heroImageMobile} media="(max-width: 599px)" />
            <source srcSet={heroImageTablet} media="(min-width: 600px) and (max-width: 991px)" />
            <img src={heroImageMobile} alt="" />
          </picture>
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
          <MobileHeroTitle>{l('page.home.hero.title')}</MobileHeroTitle>
          <MobileHeroSubtitle>{l('page.home.hero.mobile_ios_subtitle')}</MobileHeroSubtitle>
          <SendLinkButton type="button" onClick={handleShareClick}>
            {l('page.home.hero.mobile_ios_send_link')}
            <ShareIcon />
          </SendLinkButton>
          <ComingSoonRow>
            <AppleIcon src={appleLogo} alt="Apple" />
            <ComingSoonText>{l('page.home.hero.mobile_ios_coming_soon')}</ComingSoonText>
          </ComingSoonRow>
        </MobileHeroContent>
      )}

      {/* Desktop */}
      {isDesktop && (
        <HeroContent>
          <HeroTitle variant="h2">{l('page.home.hero.title')}</HeroTitle>

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
