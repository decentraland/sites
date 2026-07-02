import { memo, useCallback } from 'react'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { AnimatedBackground, useDesktopMediaQuery } from 'decentraland-ui2'
import { GOOGLE_PLAY_MOBILE_URL, googlePlayBadge } from '../../components/Home/shared/googlePlay'
import { GooglePlayButton, GooglePlayImage } from '../../components/Home/shared/MobileCTA.styled'
import { VerifiedIcon } from '../../components/Icon/VerifiedIcon'
import { getEnv } from '../../config/env'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../hooks/adapters/useTrackLinkContext'
import { useDownloadClick } from '../../hooks/useDownloadClick'
import { useDownloadSuccessHref } from '../../hooks/useDownloadSuccessHref'
import { useHangOutAction } from '../../hooks/useHangOutAction'
import appleLogo from '../../images/apple-logo.svg'
import microsoftLogo from '../../images/microsoft-logo.svg'
import { DOWNLOAD_URLS } from '../../modules/downloadConstants'
import { DownloadPlace, DownloadTarget, SegmentEvent } from '../../modules/segment'
import { OperativeSystem } from '../../types/download.types'
import { assetUrl } from '../../utils/assetUrl'
import {
  PlayAlreadyText,
  PlayBadgeImage,
  PlayBadgeLink,
  PlayBadges,
  PlayCTAButtons,
  PlayCTASection,
  PlayCard,
  PlayContainer,
  PlayDivider,
  PlayDividerLabel,
  PlayDividerLine,
  PlayDownloadButton,
  PlayDownloadCounts,
  PlayEpicButton,
  PlayExperimentalLink,
  PlayExperimentalText,
  PlayJumpInLink,
  PlayMobileContent,
  PlaySubtitle,
  PlayTitle,
  PlayTitleGroup
} from './PlayPage.styled'

// Launcher deep link. A native anchor href opens the installed app via the OS
// protocol handler — reliable on desktop and mobile, and never traps the user
// behind a download modal when they already have the app.
const JUMP_IN_URL = 'decentraland://?'

const PlayPage = memo(() => {
  const l = useFormatMessage()
  const onClickHandle = useTrackClick()
  const trackDownloadClick = useDownloadClick()
  const [, userAgentData] = useAdvancedUserAgentData()
  const isDesktop = useDesktopMediaQuery()
  const { totalDownloads } = useHangOutAction()
  const downloadSuccessHref = useDownloadSuccessHref()

  const isApple = userAgentData?.os.name === OperativeSystem.MACOS

  // Experimental web build lives under /bevy-web on the env's Decentraland host
  // (zone in dev, today in stg, org in prod).
  const bevyWebUrl = `${getEnv('DECENTRALAND_HOMEPAGE_URL') ?? 'https://decentraland.org'}/bevy-web`

  const handleDownloadClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      trackDownloadClick(e)
      if (userAgentData) {
        window.location.href = downloadSuccessHref(userAgentData.os.name, DownloadPlace.PLAY_HERO)
      }
    },
    [trackDownloadClick, userAgentData, downloadSuccessHref]
  )

  // Mobile (< sm): no glass card, a single Ruby store button — Google Play on
  // Android devices, App Store otherwise — mirroring the home Hero mobile CTA.
  if (!isDesktop) {
    const isMobileAndroid = !!userAgentData?.mobile && userAgentData?.os.name === 'Android'
    return (
      <PlayContainer>
        <AnimatedBackground variant="absolute" />
        <PlayMobileContent>
          <PlayTitleGroup>
            <PlayTitle variant="h1">{l('page.play.title')}</PlayTitle>
            <PlaySubtitle>{l('page.play.subtitle')}</PlaySubtitle>
          </PlayTitleGroup>

          <GooglePlayButton
            href={isMobileAndroid ? GOOGLE_PLAY_MOBILE_URL : DOWNLOAD_URLS.appStore}
            target="_blank"
            rel="noopener noreferrer"
            data-place={isMobileAndroid ? DownloadPlace.PLAY_HERO_GOOGLE_PLAY : DownloadPlace.PLAY_HERO_APP_STORE}
            data-event={SegmentEvent.DOWNLOAD}
            data-download-target={isMobileAndroid ? DownloadTarget.GOOGLE_PLAY : DownloadTarget.APP_STORE}
            onClick={trackDownloadClick}
          >
            <GooglePlayImage
              src={isMobileAndroid ? googlePlayBadge : assetUrl('/download-on-the-app-store.svg')}
              alt={isMobileAndroid ? 'Get it on Google Play' : 'Download on the App Store'}
            />
          </GooglePlayButton>

          <PlayAlreadyText>
            {l('page.play.already_downloaded')}{' '}
            <PlayJumpInLink
              href={JUMP_IN_URL}
              data-place={DownloadPlace.JUMP_IN_ALREADY_USER}
              data-event={SegmentEvent.CLICK}
              onClick={onClickHandle}
            >
              {l('page.play.jump_in')}
            </PlayJumpInLink>
          </PlayAlreadyText>
        </PlayMobileContent>
      </PlayContainer>
    )
  }

  return (
    <PlayContainer>
      <AnimatedBackground variant="absolute" />
      <PlayCard>
        <PlayTitleGroup>
          <PlayTitle variant="h1">{l('page.play.title')}</PlayTitle>
          <PlaySubtitle>{l('page.play.subtitle')}</PlaySubtitle>
        </PlayTitleGroup>

        <PlayCTASection>
          <PlayCTAButtons>
            <PlayDownloadButton
              href={userAgentData ? downloadSuccessHref(userAgentData.os.name, DownloadPlace.PLAY_HERO) : '/download'}
              data-place={DownloadPlace.PLAY_HERO}
              data-event={SegmentEvent.DOWNLOAD}
              data-download-target={DownloadTarget.DESKTOP_INSTALLER}
              onClick={handleDownloadClick}
            >
              {l('page.download.download_for_short')}
              {isApple ? (
                <img src={appleLogo} alt="macOS" width={32} height={32} style={{ filter: 'brightness(0) invert(1)' }} />
              ) : (
                <img src={microsoftLogo} alt="Windows" width={28} height={28} style={{ filter: 'brightness(0) invert(1)' }} />
              )}
            </PlayDownloadButton>

            <PlayEpicButton
              href={DOWNLOAD_URLS.epic}
              target="_blank"
              rel="noopener noreferrer"
              data-place={DownloadPlace.PLAY_HERO_EPIC}
              data-event={SegmentEvent.DOWNLOAD}
              data-download-target={DownloadTarget.DESKTOP_INSTALLER}
              onClick={trackDownloadClick}
            >
              {l('page.download.download_on')}
              <img src={assetUrl('/epic-logo-black.svg')} alt="Epic Games" width={40} height={40} />
            </PlayEpicButton>
          </PlayCTAButtons>

          <PlayDownloadCounts variant="body1">
            <VerifiedIcon /> {l('page.download.total_downloads', { downloads: totalDownloads })}
          </PlayDownloadCounts>

          <PlayDivider>
            <PlayDividerLine />
            <PlayDividerLabel>{l('page.play.also_available_on')}</PlayDividerLabel>
            <PlayDividerLine />
          </PlayDivider>

          <PlayBadges>
            <PlayBadgeLink
              href={DOWNLOAD_URLS.appStore}
              target="_blank"
              rel="noopener noreferrer"
              data-place={DownloadPlace.PLAY_HERO_APP_STORE}
              data-event={SegmentEvent.DOWNLOAD}
              data-download-target={DownloadTarget.APP_STORE}
              onClick={trackDownloadClick}
            >
              <PlayBadgeImage src={assetUrl('/app-store-badge.svg')} alt="Download on the App Store" />
            </PlayBadgeLink>
            <PlayBadgeLink
              href={GOOGLE_PLAY_MOBILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-place={DownloadPlace.PLAY_HERO_GOOGLE_PLAY}
              data-event={SegmentEvent.DOWNLOAD}
              data-download-target={DownloadTarget.GOOGLE_PLAY}
              onClick={trackDownloadClick}
            >
              <PlayBadgeImage src={assetUrl('/google-play-badge.svg')} alt="Get it on Google Play" />
            </PlayBadgeLink>
          </PlayBadges>
        </PlayCTASection>

        <PlayAlreadyText>
          {l('page.play.already_downloaded')}{' '}
          <PlayJumpInLink
            href={JUMP_IN_URL}
            data-place={DownloadPlace.JUMP_IN_ALREADY_USER}
            data-event={SegmentEvent.CLICK}
            onClick={onClickHandle}
          >
            {l('page.play.jump_in')}
          </PlayJumpInLink>
        </PlayAlreadyText>
      </PlayCard>

      <PlayExperimentalText>
        {l('page.play.experimental', {
          here: (
            <PlayExperimentalLink
              href={bevyWebUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-place={DownloadPlace.PLAY_EXPERIMENTAL_WEB}
              data-event={SegmentEvent.CLICK}
              onClick={onClickHandle}
            >
              {l('page.play.here')}
            </PlayExperimentalLink>
          )
        })}
      </PlayExperimentalText>
    </PlayContainer>
  )
})

PlayPage.displayName = 'PlayPage'

export { PlayPage }
