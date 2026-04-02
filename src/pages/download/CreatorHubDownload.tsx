import { memo, useCallback, useMemo } from 'react'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { Logo } from 'decentraland-ui2'
import { CTAButton } from '../../components/Buttons/CTAButton'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../hooks/adapters/useTrackLinkContext'
import { Repo, useLatestGithubRelease } from '../../hooks/useLatestGithubRelease'
import appleLogo from '../../images/apple-logo.svg'
import bannerImage from '../../images/download/creator-hub/download-creator-hub-banner.png'
import microsoftLogo from '../../images/microsoft-logo.svg'
import { triggerFileDownload } from '../../modules/file'
import { SectionViewedTrack, SegmentEvent } from '../../modules/segment'
import { addQueryParamsToUrlString, updateUrlWithLastValue } from '../../modules/url'
import { OperativeSystem } from '../../types/download.types'
import type { Architecture } from '../../types/download.types'
import {
  AlsoAvailableContainer,
  AlsoAvailableText,
  AlternativeButtonImage,
  AlternativeIconButton,
  BannerImage,
  CardContainer,
  DownloadActions,
  DownloadButtonImage,
  InfoContainer,
  PageContainer,
  Title
} from './CreatorHubDownload.styled'

const REDIRECT_PATH = '/download/creator-hub-success'

const imageByOs: Record<string, string> = {
  [OperativeSystem.WINDOWS]: microsoftLogo,
  [OperativeSystem.MACOS]: appleLogo
}

type DownloadOption = {
  text: string
  image: string
  link?: string
  arch?: Architecture
}

const CreatorHubDownload = memo(() => {
  const l = useFormatMessage()
  const trackClick = useTrackClick()
  const [isLoadingUserAgentData, userAgentData] = useAdvancedUserAgentData()
  const { links, loading: isLoadingLinks } = useLatestGithubRelease(Repo.CREATOR_HUB)

  const primaryOption: DownloadOption | null = useMemo(() => {
    if (!links) return null

    if (!userAgentData) {
      if (!links[OperativeSystem.WINDOWS]) return null
      return {
        text: OperativeSystem.WINDOWS,
        image: imageByOs[OperativeSystem.WINDOWS],
        link: links[OperativeSystem.WINDOWS].amd64,
        arch: 'amd64' as Architecture
      }
    }

    if (userAgentData.os.name === OperativeSystem.MACOS) {
      return {
        text: OperativeSystem.MACOS,
        image: imageByOs[OperativeSystem.MACOS],
        link: links[OperativeSystem.MACOS]?.arm64,
        arch: userAgentData.cpu.architecture as Architecture
      }
    }

    return {
      text: userAgentData.os.name,
      image: imageByOs[userAgentData.os.name],
      link: links[userAgentData.os.name]?.[userAgentData.cpu.architecture],
      arch: userAgentData.cpu.architecture as Architecture
    }
  }, [userAgentData, links])

  const secondaryOptions: DownloadOption[] = useMemo(() => {
    if (!links || !userAgentData) return []

    if (userAgentData.os.name === OperativeSystem.MACOS) {
      return [
        {
          text: OperativeSystem.WINDOWS,
          image: imageByOs[OperativeSystem.WINDOWS],
          link: links[OperativeSystem.WINDOWS]?.amd64
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

  const handleDownload = useCallback((option: DownloadOption) => {
    if (option.link) {
      triggerFileDownload(option.link)
    }

    const redirectUrl = updateUrlWithLastValue(new URL(REDIRECT_PATH, window.location.origin).toString(), 'os', option.text)
    const finalUrl = addQueryParamsToUrlString(redirectUrl, { arch: option.arch })
    setTimeout(() => {
      window.location.href = finalUrl
    }, 3000)
  }, [])

  if (isLoadingUserAgentData || isLoadingLinks) return null

  return (
    <PageContainer>
      <CardContainer>
        <InfoContainer>
          <Logo size="normal" />
          <Title variant="h3">{l('page.creator-hub.download.title')}</Title>
          {primaryOption && (
            <DownloadActions>
              <CTAButton
                href={primaryOption.link!}
                onClick={event => {
                  event.preventDefault()
                  trackClick(event)
                  handleDownload(primaryOption)
                }}
                event={SegmentEvent.DOWNLOAD}
                place={SectionViewedTrack.DOWNLOAD}
                endIcon={<DownloadButtonImage src={primaryOption.image} alt="" />}
                // eslint-disable-next-line @typescript-eslint/naming-convention
                label={l('page.download.download_for', { os_name: primaryOption.text })}
                isFullWidth={false}
              />
              {secondaryOptions.length > 0 && (
                <AlsoAvailableContainer>
                  <AlsoAvailableText>{l('page.creator-hub.download.also_available')}</AlsoAvailableText>
                  {secondaryOptions.map((option, index) => (
                    <AlternativeIconButton
                      key={index}
                      variant="text"
                      color="inherit"
                      onClick={event => {
                        event.preventDefault()
                        trackClick(event)
                        handleDownload(option)
                      }}
                      href={option.link}
                    >
                      <AlternativeButtonImage src={option.image} alt={option.text} />
                    </AlternativeIconButton>
                  ))}
                </AlsoAvailableContainer>
              )}
            </DownloadActions>
          )}
        </InfoContainer>
        <BannerImage src={bannerImage} alt="Decentraland Creator Hub" />
      </CardContainer>
    </PageContainer>
  )
})

CreatorHubDownload.displayName = 'CreatorHubDownload'

export { CreatorHubDownload }
