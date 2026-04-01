import { memo, useCallback, useEffect } from 'react'
import { useWalletState } from '@dcl/core-web3/lazy'
import { useAdvancedUserAgentData, useAsyncMemo } from '@dcl/hooks'
import { DownloadModal, JumpInIcon } from 'decentraland-ui2'
import { heroContent } from '../../../data/static-content'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { useHangOutAction } from '../../../hooks/useHangOutAction'
import appleLogo from '../../../images/apple-logo.svg'
import microsoftLogo from '../../../images/microsoft-logo.svg'
import { ExplorerDownloads } from '../../../modules/explorerDownloads'
import { formatToShorthand } from '../../../modules/number'
import { SectionViewedTrack } from '../../../modules/segment'
import { OperativeSystem } from '../../../types/download.types'
import { assetUrl } from '../../../utils/assetUrl'
import { VerifiedIcon } from '../../Icon/VerifiedIcon'
import { DownloadIcon } from './DownloadIcon'
import { ShareIcon } from './ShareIcon'
import {
  AlreadyUserDownloadLink,
  AlreadyUserText,
  AppleIcon,
  ComingSoonRow,
  ComingSoonText,
  GooglePlayButton,
  GooglePlayImage,
  GradientBottom,
  GradientTop,
  HangOutButton,
  HeroBackground,
  HeroCTAWrapper,
  HeroContainer,
  HeroContent,
  HeroDownloadCounts,
  HeroDownloadInfo,
  HeroOsIcon,
  HeroPlatformIcon,
  HeroPlatformIcons,
  HeroPlatformSeparator,
  HeroTitle,
  MobileHeroContent,
  MobileHeroSubtitle,
  MobileHeroTitle,
  SendLinkButton
} from './Hero.styled'

const heroImageDesktop = assetUrl('/landing_hero.webp')
const heroImageTablet = assetUrl('/hero_tablet.webp')
const heroImageMobile = assetUrl('/hero_mobile.webp')
const googlePlayBadge = assetUrl('/google_play_cta.svg')

const GOOGLE_PLAY_URL =
  'https://play.google.com/store/apps/details?id=org.decentraland.godotexplorer&pcampaignid=web_share&utm_source=dcl_foundation&utm_medium=internal&utm_campaign=mobile_launch&utm_content=android&pli=1'

const imageByOs: Record<string, string> = {
  [OperativeSystem.WINDOWS]: microsoftLogo,
  [OperativeSystem.MACOS]: appleLogo
}

// Module-level cache for download counts — survives component remounts.
// useAdvancedUserAgentData cache is handled in @dcl/hooks directly.
let cachedDownloadCounts: string | null = null

const Hero = memo(({ isDesktop }: { isDesktop: boolean }) => {
  const { isConnected, address } = useWalletState()
  const effectivelySignedIn = isConnected || !!address
  const [, userAgentData] = useAdvancedUserAgentData()
  const l = useFormatMessage()
  const onClickHandle = useTrackClick()
  const { handleClick, isDownloadModalOpen, closeDownloadModal, downloadModalProps } = useHangOutAction()

  const [rawDownloads, rawDownloadsStatus] = useAsyncMemo(async () => ExplorerDownloads.get().getTotalDownloads(), [])

  const rawFormatted = !rawDownloadsStatus.loading && rawDownloadsStatus.loaded && rawDownloads ? formatToShorthand(rawDownloads) : null
  if (rawFormatted) cachedDownloadCounts = rawFormatted
  const downloadCountsFormatted = cachedDownloadCounts

  const osImage = userAgentData ? imageByOs[userAgentData.os.name] : null

  const isMobileAndroid = !!userAgentData?.mobile && userAgentData.os.name === 'Android'

  // Remove the prerendered hero shell now that React's Hero has mounted.
  // Capture the initial viewport height for mobile so the hero doesn't resize
  // when the browser toolbar hides/shows on scroll (iOS Safari workaround).
  useEffect(() => {
    document.getElementById('hero-shell')?.remove()
    document.getElementById('hero-shell-nav')?.remove()
    document.documentElement.style.setProperty('--hero-vh', `${window.innerHeight * 0.01}px`)
  }, [])

  const handleDownloadClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onClickHandle(e)
      // Intentional hard navigation — /download_success triggers a real file download
      // via the browser, which requires a full page load (not SPA navigation).
      if (userAgentData) {
        window.location.href = `/download_success?os=${userAgentData.os.name}`
      }
    },
    [onClickHandle, userAgentData]
  )

  const handleShareClick = useCallback(async () => {
    const shareData = {
      title: 'Decentraland',
      text: 'Download Decentraland',
      url: window.location.href
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled sharing or share failed — silently ignore
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
    }
  }, [])

  return (
    <HeroContainer>
      <HeroBackground>
        {isDesktop ? (
          <video autoPlay loop muted playsInline poster={heroImageDesktop} preload="none">
            <source src={heroContent.backgroundVideo} type="video/mp4" />
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

      {/* Mobile: always show iOS-style layout to avoid jumps while UA loads.
          Android-specific content replaces it once detected. */}
      {!isDesktop && isMobileAndroid && (
        <MobileHeroContent>
          <MobileHeroTitle>{l('page.home.hero.mobile_android_title')}</MobileHeroTitle>
          <MobileHeroSubtitle>{l('page.home.hero.mobile_android_subtitle')}</MobileHeroSubtitle>
          <GooglePlayButton href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer">
            <GooglePlayImage src={googlePlayBadge} alt="Get it on Google Play" />
          </GooglePlayButton>
        </MobileHeroContent>
      )}

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

      {isDesktop && (
        <HeroContent>
          <HeroTitle variant={isDesktop ? 'h2' : 'h3'}>{l('page.home.hero.title')}</HeroTitle>

          {effectivelySignedIn && isDesktop ? (
            <HeroCTAWrapper>
              <HangOutButton
                variant="contained"
                data-place={SectionViewedTrack.LANDING_HERO}
                data-event="click"
                onClick={handleDownloadClick}
                endIcon={osImage ? <HeroOsIcon src={osImage} alt={userAgentData?.os.name ?? ''} /> : undefined}
              >
                {l('page.download.download')}
              </HangOutButton>
              {downloadCountsFormatted && userAgentData && (
                <HeroDownloadInfo>
                  <HeroDownloadCounts variant="body1">
                    <VerifiedIcon /> {l('page.download.total_downloads', { downloads: downloadCountsFormatted })}
                  </HeroDownloadCounts>
                  <HeroPlatformSeparator />
                  <HeroPlatformIcons>
                    <a href="/download_success?os=Windows">
                      <HeroPlatformIcon src={microsoftLogo} alt="Windows" style={{ filter: 'brightness(0) invert(1)' }} />
                    </a>
                  </HeroPlatformIcons>
                  <HeroPlatformIcons>
                    <a href="/download_success?os=macOS">
                      <HeroPlatformIcon src={appleLogo} alt="macOS" style={{ filter: 'brightness(0) invert(1)' }} />
                    </a>
                  </HeroPlatformIcons>
                  <HeroPlatformIcons>
                    <a
                      href="https://play.google.com/store/apps/details?id=org.decentraland.godotexplorer&pcampaignid=web_share&utm_source=partners&utm_medium=pr&utm_campaign=mobile_launch&utm_content=android"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <HeroPlatformIcon
                        src={assetUrl('/google_play_icon.svg')}
                        alt="Android"
                        style={{ filter: 'brightness(0) invert(1)' }}
                      />
                    </a>
                  </HeroPlatformIcons>
                  <HeroPlatformIcons>
                    <a href="https://store.epicgames.com/en-US/p/decentraland-b692fb" target="_blank" rel="noopener noreferrer">
                      <HeroPlatformIcon src={assetUrl('/epic_icon.svg')} alt="Epic Games" style={{ filter: 'brightness(0) invert(1)' }} />
                    </a>
                  </HeroPlatformIcons>
                </HeroDownloadInfo>
              )}
            </HeroCTAWrapper>
          ) : (
            <HeroCTAWrapper>
              <HangOutButton
                variant="contained"
                data-place={SectionViewedTrack.LANDING_HERO}
                data-event="click"
                onClick={e => {
                  onClickHandle(e)
                  handleClick(e)
                }}
                endIcon={<JumpInIcon />}
              >
                {l('page.home.hang_out_now')}
              </HangOutButton>
              {isDesktop && userAgentData && (
                <AlreadyUserText>
                  {l('page.home.hero.already_user', {
                    download: (
                      <AlreadyUserDownloadLink key="download" href={`/download_success?os=${userAgentData.os.name}`}>
                        {l('page.home.hero.download')} <DownloadIcon />
                      </AlreadyUserDownloadLink>
                    )
                  })}
                </AlreadyUserText>
              )}
            </HeroCTAWrapper>
          )}
        </HeroContent>
      )}
      <DownloadModal open={isDownloadModalOpen} onClose={closeDownloadModal} {...downloadModalProps} />
    </HeroContainer>
  )
})

Hero.displayName = 'Hero'

export { Hero }
