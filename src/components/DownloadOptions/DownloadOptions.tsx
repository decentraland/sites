import { memo, useCallback, useMemo } from 'react'
import { useAdvancedUserAgentData, useAnalytics, useAsyncMemo } from '@dcl/hooks'
import { CDNSource, getCDNRelease } from 'decentraland-ui2/dist/modules/cdnReleases'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../hooks/adapters/useTrackLinkContext'
import { useGetIdentityId } from '../../hooks/useGetIdentityId'
import appleLogo from '../../images/apple-logo.svg'
import microsoftLogo from '../../images/microsoft-logo.svg'
import { getDownloadLinkWithIdentity } from '../../modules/downloadWithIdentity'
import { ExplorerDownloads } from '../../modules/explorerDownloads'
import { formatToShorthand } from '../../modules/number'
import { trackCheckpoint } from '../../modules/onboardingCheckpoint'
import { SectionViewedTrack, SegmentEvent } from '../../modules/segment'
import { addQueryParamsToUrlString, sanitizeCDNReleaseLinks, updateUrlWithLastValue } from '../../modules/url'
import { Architecture, DownloadOptionProps, OperativeSystem } from '../../types/download.types'
import { assetUrl } from '../../utils/assetUrl'
import { CTAButton } from '../Buttons/CTAButton'
import { GOOGLE_PLAY_DESKTOP_URL } from '../Home/shared/googlePlay'
import { VerifiedIcon } from '../Icon/VerifiedIcon'
import {
  AlternativeButton,
  AlternativeButtonImage,
  AlternativeButtonsWrapper,
  AlternativeContainer,
  DownloadActions,
  DownloadButtonImage,
  DownloadButtonsContainer,
  DownloadCounts,
  DownloadOptionsContainer
} from './DownloadOptions.styled'

const EPIC_GAMES_URL = 'https://store.epicgames.com/en-US/p/decentraland-b692fb'

interface DownloadOptionsProps {
  hideDownloadCounts?: boolean
  downloadOnClick?: boolean
  email?: string
  user?: string
}

const imageByOs: Record<string, string> = {
  [OperativeSystem.WINDOWS]: microsoftLogo,
  [OperativeSystem.MACOS]: appleLogo
}

const DownloadOptions = memo(({ hideDownloadCounts, downloadOnClick, email, user }: DownloadOptionsProps) => {
  const [isLoadingUserAgentData, userAgentData] = useAdvancedUserAgentData()
  const getIdentityId = useGetIdentityId()
  const l = useFormatMessage()
  const { track } = useAnalytics()
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

    const options: DownloadOptionProps[] = [
      {
        text: OperativeSystem.MACOS,
        image: imageByOs[OperativeSystem.MACOS],
        link: userAgentData.os.name === OperativeSystem.MACOS ? links[OperativeSystem.MACOS]?.amd64 : links[OperativeSystem.MACOS]?.arm64,
        arch: userAgentData.os.name === OperativeSystem.MACOS ? ('amd64' as Architecture) : undefined
      }
    ]

    if (userAgentData.os.name === OperativeSystem.MACOS) {
      options.push({
        text: OperativeSystem.WINDOWS,
        image: imageByOs[OperativeSystem.WINDOWS],
        link: links[OperativeSystem.WINDOWS]?.x64
      })
    }

    return options
  }, [userAgentData, links])

  const onClickDownloadHandler = useCallback(
    async (option: DownloadOptionProps) => {
      // CP5 completed + CP6 reached: user clicked download
      trackCheckpoint(track, {
        checkpointId: 5,
        action: 'completed',
        email,
        wallet: user
      })
      trackCheckpoint(track, {
        checkpointId: 6,
        action: 'reached',
        email,
        wallet: user,
        metadata: { os: option.text, arch: option.arch }
      })

      if (downloadOnClick) {
        await getDownloadLinkWithIdentity({
          os: option.text,
          arch: option.arch,
          fallbackLinks: links,
          getIdentityId
        })
      }

      const redirectPath = '/download_success'
      const redirectUrl = updateUrlWithLastValue(new URL(redirectPath, window.location.origin).toString(), 'os', option.text)
      const finalUrl = addQueryParamsToUrlString(redirectUrl, { arch: option.arch })
      setTimeout(
        () => {
          window.location.href = finalUrl
        },
        downloadOnClick ? 3000 : 0
      )
    },
    [downloadOnClick, getIdentityId, links, track, email, user]
  )

  const downloadCountsFormatted = !downloadsStatus.loading && downloadsStatus.loaded && downloads ? formatToShorthand(downloads) : null

  if (isLoadingUserAgentData) return null

  return (
    <DownloadOptionsContainer>
      {primaryDownloadOptions.length > 0 && (
        <DownloadActions>
          <DownloadButtonsContainer>
            {primaryDownloadOptions.map((option, index) => (
              <CTAButton
                key={index}
                href={option.link!}
                onClick={event => {
                  event.preventDefault()
                  onClickHandle(event)
                  onClickDownloadHandler(option)
                }}
                event={SegmentEvent.DOWNLOAD}
                place={SectionViewedTrack.DOWNLOAD}
                endIcon={<DownloadButtonImage src={option.image} />}
                label={l('page.download.download')}
                isFullWidth={false}
              />
            ))}
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
                  startIcon={<AlternativeButtonImage src={option.image} />}
                >
                  {option.arch ? `(${l(`page.download.${option.arch}_processors_short`)})` : undefined}
                </AlternativeButton>
              ))}
              <AlternativeButton
                variant="text"
                color="inherit"
                href={GOOGLE_PLAY_DESKTOP_URL}
                {...{ target: '_blank', rel: 'noopener noreferrer' }}
                startIcon={<AlternativeButtonImage src={assetUrl('/google_play_icon.svg')} />}
              />
              <AlternativeButton
                variant="text"
                color="inherit"
                href={EPIC_GAMES_URL}
                {...{ target: '_blank', rel: 'noopener noreferrer' }}
                startIcon={<AlternativeButtonImage src={assetUrl('/epic_icon.svg')} />}
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
