import { memo, useCallback } from 'react'
import { useWalletState } from '@dcl/core-web3/lazy'
import { useAdvancedUserAgentData, useAsyncMemo } from '@dcl/hooks'
import type { AdvancedNavigatorUAData } from '@dcl/hooks'
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
import {
  AlreadyUserDownloadLink,
  AlreadyUserText,
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
  HeroPlatformLabel,
  HeroPlatformSeparator,
  HeroTitle
} from './Hero.styled'

const heroImageDesktop = assetUrl('/landing_hero.webp')
const heroImageMobile = assetUrl('/hero_mobile.webp')

const imageByOs: Record<string, string> = {
  [OperativeSystem.WINDOWS]: microsoftLogo,
  [OperativeSystem.MACOS]: appleLogo
}

// Module-level cache — survives component remounts (StrictMode, Suspense, etc.)
let cachedUserAgentData: AdvancedNavigatorUAData | null = null
let cachedDownloadCounts: string | null = null

const Hero = memo(({ isDesktop }: { isDesktop: boolean }) => {
  const { isConnected, address } = useWalletState()
  const effectivelySignedIn = isConnected || !!address
  const [, rawUserAgentData] = useAdvancedUserAgentData()
  const l = useFormatMessage()
  const onClickHandle = useTrackClick()
  const { handleClick, isDownloadModalOpen, closeDownloadModal, downloadModalProps } = useHangOutAction()

  const [rawDownloads, rawDownloadsStatus] = useAsyncMemo(async () => ExplorerDownloads.get().getTotalDownloads(), [])

  // Module-level cache: once we get a value, it sticks across remounts
  if (rawUserAgentData) cachedUserAgentData = rawUserAgentData
  const userAgentData = cachedUserAgentData

  const rawFormatted = !rawDownloadsStatus.loading && rawDownloadsStatus.loaded && rawDownloads ? formatToShorthand(rawDownloads) : null
  if (rawFormatted) cachedDownloadCounts = rawFormatted
  const downloadCountsFormatted = cachedDownloadCounts

  const osImage = userAgentData ? imageByOs[userAgentData.os.name] : null

  const handleDownloadClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onClickHandle(e)
      if (userAgentData) {
        window.location.href = `/download_success?os=${userAgentData.os.name}`
      }
    },
    [onClickHandle, userAgentData]
  )

  const heroImage = isDesktop ? heroImageDesktop : heroImageMobile

  return (
    <HeroContainer>
      <HeroBackground>
        {isDesktop ? (
          <video autoPlay loop muted playsInline poster={heroImage} preload="none">
            <source src={heroContent.backgroundVideo} type="video/mp4" />
          </video>
        ) : (
          <img src={heroImage} alt="" />
        )}
      </HeroBackground>
      <GradientTop />
      <GradientBottom />
      <HeroContent>
        <HeroTitle variant={isDesktop ? 'h2' : 'h3'}>{heroContent.title}</HeroTitle>

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
                  <HeroPlatformIcon src={microsoftLogo} alt="Windows" />
                </HeroPlatformIcons>
                <HeroPlatformIcons>
                  <HeroPlatformIcon src={appleLogo} alt="macOS" />
                  {userAgentData.os.name === OperativeSystem.MACOS && userAgentData.cpu.architecture === 'amd64' && (
                    <HeroPlatformLabel variant="body1">({l('page.download.amd64_processors_short')})</HeroPlatformLabel>
                  )}
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
              HANG OUT NOW
            </HangOutButton>
            {isDesktop && userAgentData && (
              <AlreadyUserText>
                {l('component.home.hero.already_user', {
                  download: (
                    <AlreadyUserDownloadLink href={`/download_success?os=${userAgentData.os.name}`}>
                      {l('component.home.hero.download')} <DownloadIcon />
                    </AlreadyUserDownloadLink>
                  )
                })}
              </AlreadyUserText>
            )}
          </HeroCTAWrapper>
        )}
      </HeroContent>
      <DownloadModal open={isDownloadModalOpen} onClose={closeDownloadModal} {...downloadModalProps} />
    </HeroContainer>
  )
})

Hero.displayName = 'Hero'

export { Hero }
