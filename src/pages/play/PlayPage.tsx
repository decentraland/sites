import { memo, useCallback } from 'react'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { AnimatedBackground, useDesktopMediaQuery } from 'decentraland-ui2'
import { GOOGLE_PLAY_MOBILE_URL, googlePlayBadge } from '../../components/Home/shared/googlePlay'
import { GooglePlayButton, GooglePlayImage } from '../../components/Home/shared/MobileCTA.styled'
import { VerifiedIcon } from '../../components/Icon/VerifiedIcon'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../hooks/adapters/useTrackLinkContext'
import { ANON_USER_ID_PARAM, useAnonUserId } from '../../hooks/useAnonUserId'
import { useHangOutAction } from '../../hooks/useHangOutAction'
import appleLogo from '../../images/apple-logo.svg'
import microsoftLogo from '../../images/microsoft-logo.svg'
import { DOWNLOAD_URLS } from '../../modules/downloadConstants'
import { DownloadPlace, SectionViewedTrack, SegmentEvent } from '../../modules/segment'
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
  const anonUserId = useAnonUserId()
  const [, userAgentData] = useAdvancedUserAgentData()
  const isDesktop = useDesktopMediaQuery()
  const { totalDownloads } = useHangOutAction()

  // Bake the campaign anon_user_id into the /download_success URL so the wrapper
  // installer runs and attribution survives end-to-end (mirrors the home Hero).
  const buildDownloadSuccessHref = useCallback(
    (os: string, place: string) => {
      const params = new URLSearchParams({ os, place })
      if (anonUserId) {
        params.set(ANON_USER_ID_PARAM, anonUserId)
      }
      return `/download_success?${params.toString()}`
    },
    [anonUserId]
  )

  const isApple = userAgentData?.os.name === OperativeSystem.MACOS

  const handleDownloadClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      onClickHandle(e)
      if (userAgentData) {
        window.location.href = buildDownloadSuccessHref(userAgentData.os.name, DownloadPlace.PLAY_HERO)
      }
    },
    [onClickHandle, userAgentData, buildDownloadSuccessHref]
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
            data-place={DownloadPlace.PLAY_HERO}
            data-event={SegmentEvent.DOWNLOAD}
            onClick={onClickHandle}
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
              href={userAgentData ? buildDownloadSuccessHref(userAgentData.os.name, DownloadPlace.PLAY_HERO) : '/download'}
              data-place={SectionViewedTrack.PLAY_HERO}
              data-event={SegmentEvent.DOWNLOAD}
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
              onClick={onClickHandle}
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
              data-place={DownloadPlace.PLAY_HERO}
              data-event={SegmentEvent.DOWNLOAD}
              onClick={onClickHandle}
            >
              <PlayBadgeImage src={assetUrl('/app-store-badge.svg')} alt="Download on the App Store" />
            </PlayBadgeLink>
            <PlayBadgeLink
              href={GOOGLE_PLAY_MOBILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-place={DownloadPlace.PLAY_HERO}
              data-event={SegmentEvent.DOWNLOAD}
              onClick={onClickHandle}
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
    </PlayContainer>
  )
})

PlayPage.displayName = 'PlayPage'

export { PlayPage }
