import { memo, useCallback, useMemo } from 'react'
import { useAdvancedUserAgentData, useAsyncMemo } from '@dcl/hooks'
import { CDNSource, getCDNRelease } from 'decentraland-ui2/dist/modules/cdnReleases'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../hooks/adapters/useTrackLinkContext'
import { ANON_USER_ID_PARAM, useAnonUserId } from '../../hooks/useAnonUserId'
import { useGetIdentityId } from '../../hooks/useGetIdentityId'
import appleLogo from '../../images/apple-logo.svg'
import microsoftLogo from '../../images/microsoft-logo.svg'
import { DOWNLOAD_URLS } from '../../modules/downloadConstants'
import { getDownloadLinkWithIdentity } from '../../modules/downloadWithIdentity'
import { ExplorerDownloads } from '../../modules/explorerDownloads'
import { formatToShorthand } from '../../modules/number'
import { DownloadPlace, SectionViewedTrack, SegmentEvent } from '../../modules/segment'
import { addQueryParamsToUrlString, sanitizeCDNReleaseLinks, updateUrlWithLastValue } from '../../modules/url'
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

const imageByOs: Record<string, string> = {
  [OperativeSystem.WINDOWS]: microsoftLogo,
  [OperativeSystem.MACOS]: appleLogo
}

const DownloadOptions = memo(({ hideDownloadCounts, downloadOnClick }: DownloadOptionsProps) => {
  const [isLoadingUserAgentData, userAgentData] = useAdvancedUserAgentData()
  const getIdentityId = useGetIdentityId()
  const anonUserId = useAnonUserId()
  const l = useFormatMessage()
  const onClickHandle = useTrackClick()

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

      const redirectPath = '/download_success'
      const redirectUrl = updateUrlWithLastValue(new URL(redirectPath, window.location.origin).toString(), 'os', option.text)
      const finalUrl = addQueryParamsToUrlString(redirectUrl, {
        arch: option.arch,
        place: DownloadPlace.DOWNLOAD_PAGE,
        [ANON_USER_ID_PARAM]: anonUserId
      })
      setTimeout(
        () => {
          window.location.href = finalUrl
        },
        downloadOnClick ? 3000 : 0
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
                  onClick={event => {
                    event.preventDefault()
                    onClickHandle(event)
                    onClickDownloadHandler(option)
                  }}
                >
                  {l('page.download.download_for_short')}
                  <img src={option.image} alt={option.text} width={32} height={32} style={{ filter: 'brightness(0) invert(1)' }} />
                </DownloadButton>
              ) : null
            )}
            <EpicButton
              href={EPIC_GAMES_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-place={DownloadPlace.DOWNLOAD_PAGE}
              data-event={SegmentEvent.DOWNLOAD}
              onClick={onClickHandle}
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
                  onClick={event => {
                    event.preventDefault()
                    onClickHandle(event)
                    onClickDownloadHandler(option)
                  }}
                  href={option.link}
                  key={index}
                  aria-label={option.text}
                  startIcon={<AlternativeButtonImage src={option.image} />}
                />
              ))}
              <AlternativeButton
                variant="text"
                color="inherit"
                href={DOWNLOAD_URLS.appStore}
                {...{ target: '_blank', rel: 'noopener noreferrer' }}
                aria-label="iOS"
                startIcon={<AlternativeButtonImage src={assetUrl('/ios-logo.svg')} />}
              />
              <AlternativeButton
                variant="text"
                color="inherit"
                href={GOOGLE_PLAY_DESKTOP_URL}
                {...{ target: '_blank', rel: 'noopener noreferrer' }}
                aria-label="Google Play"
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
