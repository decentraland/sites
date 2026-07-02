import { memo, useCallback, useMemo } from 'react'
import { useAdvancedUserAgentData, useAsyncMemo } from '@dcl/hooks'
import { CDNSource, getCDNRelease } from 'decentraland-ui2/dist/modules/cdnReleases'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { ANON_USER_ID_PARAM, useAnonUserId } from '../../hooks/useAnonUserId'
import { useDownloadClick } from '../../hooks/useDownloadClick'
import { useGetIdentityId } from '../../hooks/useGetIdentityId'
import appleLogo from '../../images/apple-logo.svg'
import microsoftLogo from '../../images/microsoft-logo.svg'
import { collectCampaignParams } from '../../modules/campaignParams'
import { DOWNLOAD_URLS } from '../../modules/downloadConstants'
import { getDownloadLinkWithIdentity } from '../../modules/downloadWithIdentity'
import { ExplorerDownloads } from '../../modules/explorerDownloads'
import { formatToShorthand } from '../../modules/number'
import { DownloadPlace, DownloadTarget, SectionViewedTrack, SegmentEvent } from '../../modules/segment'
import { buildDownloadSuccessHref, sanitizeCDNReleaseLinks } from '../../modules/url'
import { Architecture, DownloadOptionProps, OperativeSystem } from '../../types/download.types'
import { assetUrl } from '../../utils/assetUrl'
import { DownloadButton, EpicButton } from '../Home/Hero/Hero.styled'
import { EPIC_GAMES_URL } from '../Home/shared/epicGames'
import { GOOGLE_PLAY_DESKTOP_URL } from '../Home/shared/googlePlay'
import { VerifiedIcon } from '../Icon/VerifiedIcon'
import {
  AlternativeButton,
  AlternativeButtonImage,
  AlternativeButtonsWrapper,
  AlternativeContainer,
  DownloadActions,
  DownloadButtonsContainer,
  DownloadCounts,
  DownloadOptionsContainer
} from './DownloadOptions.styled'

interface DownloadOptionsProps {
  hideDownloadCounts?: boolean
  downloadOnClick?: boolean
}

// NOTE: shortened from a hardcoded 3000ms to 400ms — the git history has no
// documented reason for the original value. Delay before navigating away
// after `downloadOnClick` triggers an in-page download
// (`getDownloadLinkWithIdentity` → `triggerFileDownload` → `clickAnchor`). By
// the time this timeout is scheduled the anchor's synchronous `.click()` has
// already dispatched the download to the browser (see `file.ts`'s
// `clickAnchor`, which only needs a `requestAnimationFrame` tick before it's
// safe to detach the anchor) — this delay only needs to outlast that
// dispatch, not any user-visible UI moment. Kept well above a single frame
// for headroom on slow devices without holding the redirect for seconds.
const POST_DOWNLOAD_NAVIGATION_DELAY_MS = 400

const imageByOs: Record<string, string> = {
  [OperativeSystem.WINDOWS]: microsoftLogo,
  [OperativeSystem.MACOS]: appleLogo
}

const DownloadOptions = memo(({ hideDownloadCounts, downloadOnClick }: DownloadOptionsProps) => {
  const [isLoadingUserAgentData, userAgentData] = useAdvancedUserAgentData()
  const getIdentityId = useGetIdentityId()
  const anonUserId = useAnonUserId()
  const l = useFormatMessage()
  const trackDownloadClick = useDownloadClick()

  const links = useMemo(() => sanitizeCDNReleaseLinks(getCDNRelease(CDNSource.LAUNCHER)) || {}, [])

  const [downloads, downloadsStatus] = useAsyncMemo(async () => ExplorerDownloads.get().getTotalDownloads(), [])

  const primaryDownloadOptions: DownloadOptionProps[] = useMemo(() => {
    if (!userAgentData) {
      if (!links[OperativeSystem.WINDOWS]) return []
      return [
        {
          text: OperativeSystem.WINDOWS,
          image: imageByOs[OperativeSystem.WINDOWS],
          link: links[OperativeSystem.WINDOWS].x64,
          arch: 'x64' as Architecture
        }
      ]
    }

    if (!links[userAgentData.os.name]) return []

    if (userAgentData.os.name === OperativeSystem.MACOS) {
      return [
        {
          text: OperativeSystem.MACOS,
          image: imageByOs[OperativeSystem.MACOS],
          link: links[OperativeSystem.MACOS].arm64,
          arch: userAgentData.cpu.architecture as Architecture
        }
      ]
    }

    return [
      {
        text: userAgentData.os.name,
        image: imageByOs[userAgentData.os.name],
        link: links[userAgentData.os.name][userAgentData.cpu.architecture],
        arch: userAgentData.cpu.architecture as Architecture
      }
    ]
  }, [userAgentData, links])

  const secondaryDownloadOptions: DownloadOptionProps[] = useMemo(() => {
    if (!userAgentData) {
      if (!links[OperativeSystem.MACOS]) return []
      return [
        {
          text: OperativeSystem.MACOS,
          image: imageByOs[OperativeSystem.MACOS],
          link: links[OperativeSystem.MACOS].arm64
        }
      ]
    }

    if (userAgentData.os.name === OperativeSystem.MACOS) {
      return [
        {
          text: OperativeSystem.WINDOWS,
          image: imageByOs[OperativeSystem.WINDOWS],
          link: links[OperativeSystem.WINDOWS]?.x64
        }
      ]
    }

    return [
      {
        text: OperativeSystem.MACOS,
        image: imageByOs[OperativeSystem.MACOS],
        link: links[OperativeSystem.MACOS]?.arm64
      }
    ]
  }, [userAgentData, links])

  const onClickDownloadHandler = useCallback(
    async (option: DownloadOptionProps) => {
      if (downloadOnClick) {
        await getDownloadLinkWithIdentity({
          os: option.text,
          arch: option.arch,
          fallbackLinks: links,
          queryParams: { [ANON_USER_ID_PARAM]: anonUserId },
          getIdentityId,
          anonUserId
        })
      }

      // Forward the partner campaign params into /download_success (through the
      // shared href builder) so the desktop installer funnel
      // (download_started/_success/_failed) carries the same attribution the
      // landing click had.
      const finalUrl = buildDownloadSuccessHref(option.text, DownloadPlace.DOWNLOAD_PAGE, {
        anonUserId,
        arch: option.arch,
        campaignParams: collectCampaignParams()
      })
      setTimeout(
        () => {
          window.location.href = finalUrl
        },
        downloadOnClick ? POST_DOWNLOAD_NAVIGATION_DELAY_MS : 0
      )
    },
    [downloadOnClick, getIdentityId, anonUserId, links]
  )

  const downloadCountsFormatted = !downloadsStatus.loading && downloadsStatus.loaded && downloads ? formatToShorthand(downloads) : null

  if (isLoadingUserAgentData) return null

  return (
    <DownloadOptionsContainer>
      {primaryDownloadOptions.length > 0 && (
        <DownloadActions>
          <DownloadButtonsContainer>
            {primaryDownloadOptions.map((option, index) =>
              option.link ? (
                <DownloadButton
                  key={index}
                  href={option.link}
                  data-place={SectionViewedTrack.DOWNLOAD}
                  data-event={SegmentEvent.DOWNLOAD}
                  data-download-target={DownloadTarget.DESKTOP_INSTALLER}
                  onClick={event => {
                    event.preventDefault()
                    trackDownloadClick(event)
                    onClickDownloadHandler(option)
                  }}
                >
                  {l('page.download.download_for_short')}
                  <img src={option.image} alt={option.text} width={32} height={32} style={{ filter: 'brightness(0) invert(1)' }} />
                </DownloadButton>
              ) : null
            )}
            {/* Epic delivers the same desktop client, just via the Epic Games
                Store — it sits on the desktop side of the split (not a mobile
                store exit), so it shares the desktop_installer target. */}
            <EpicButton
              href={EPIC_GAMES_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-place={DownloadPlace.DOWNLOAD_PAGE}
              data-event={SegmentEvent.DOWNLOAD}
              data-download-target={DownloadTarget.DESKTOP_INSTALLER}
              onClick={trackDownloadClick}
            >
              {l('page.download.download_on')}
              <img src={assetUrl('/epic_icon.svg')} alt="Epic Games" width={32} height={32} style={{ filter: 'brightness(0)' }} />
            </EpicButton>
          </DownloadButtonsContainer>
          <AlternativeContainer>
            {!hideDownloadCounts && downloadCountsFormatted && (
              <DownloadCounts variant="body1">
                <VerifiedIcon /> {l('page.download.total_downloads', { downloads: downloadCountsFormatted })}
              </DownloadCounts>
            )}
            <AlternativeButtonsWrapper>
              {secondaryDownloadOptions.map((option, index) => (
                <AlternativeButton
                  variant="text"
                  color="inherit"
                  data-place={DownloadPlace.DOWNLOAD_PAGE}
                  data-event={SegmentEvent.DOWNLOAD}
                  data-download-target={DownloadTarget.DESKTOP_INSTALLER}
                  onClick={event => {
                    event.preventDefault()
                    trackDownloadClick(event)
                    onClickDownloadHandler(option)
                  }}
                  href={option.link}
                  key={index}
                  aria-label={option.text}
                  startIcon={<AlternativeButtonImage src={option.image} />}
                />
              ))}
              {/* Store badges exit /download to the App Store / Google Play (new
                  tab), never through /download_success — so they can't produce a
                  download_started and won't inflate desktop installer activations.
                  Tracked as store exits so partner attribution still lands.
                  `useDownloadClick` merges the campaign params from the URL. */}
              <AlternativeButton
                variant="text"
                color="inherit"
                href={DOWNLOAD_URLS.appStore}
                {...{ target: '_blank', rel: 'noopener noreferrer' }}
                aria-label="iOS"
                data-place={DownloadPlace.DOWNLOAD_PAGE}
                data-event={SegmentEvent.DOWNLOAD}
                data-os="iOS"
                data-download-target={DownloadTarget.APP_STORE}
                onClick={trackDownloadClick}
                startIcon={<AlternativeButtonImage src={assetUrl('/ios-logo.svg')} />}
              />
              <AlternativeButton
                variant="text"
                color="inherit"
                href={GOOGLE_PLAY_DESKTOP_URL}
                {...{ target: '_blank', rel: 'noopener noreferrer' }}
                aria-label="Google Play"
                data-place={DownloadPlace.DOWNLOAD_PAGE}
                data-event={SegmentEvent.DOWNLOAD}
                data-os="Android"
                data-download-target={DownloadTarget.GOOGLE_PLAY}
                onClick={trackDownloadClick}
                startIcon={<AlternativeButtonImage src={assetUrl('/google_play_icon.svg')} />}
              />
            </AlternativeButtonsWrapper>
          </AlternativeContainer>
        </DownloadActions>
      )}
    </DownloadOptionsContainer>
  )
})

DownloadOptions.displayName = 'DownloadOptions'

export { DownloadOptions }
