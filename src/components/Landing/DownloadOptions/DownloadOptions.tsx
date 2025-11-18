import * as React from 'react'
import { useCallback, useEffect, useMemo } from 'react'
import { Logo } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { useGetIdentityId } from '../../../hooks/useGetIdentityId'
import appleLogo from '../../../images/apple-logo.svg'
import microsoftLogo from '../../../images/microsoft-logo.svg'
import { downloadWithIdentity } from '../../../modules/downloadWithIdentity'
import { SectionViewedTrack, SegmentEvent } from '../../../modules/segment'
import { addQueryParamsToUrlString, updateUrlWithLastValue } from '../../../modules/url'
import { normalizeUserAgentArchitectureByOs } from '../../../modules/userAgent'
import { DownloadButton } from '../../Buttons/DownloadButton'
import { VerifiedIcon } from '../../Icon/VerifiedIcon'
import { WrapDecentralandText } from '../../WrapDecentralandText'
import { Architecture, DownloadOptionProps, DownloadOptionsProps, OperativeSystem } from './DownloadOptions.types'
import {
  DownloadActions,
  DownloadAlternativeButton,
  DownloadAlternativeButtonImage,
  DownloadAlternativeButtonsWrapper,
  DownloadAlternativeContainer,
  DownloadButtonImage,
  DownloadButtonsContainer,
  DownloadCounts,
  DownloadDetail,
  DownloadSubtitle,
  DownloadTitle,
  DownloadUnavailable,
  DownloadUnavailableIFrame
} from './DownloadOptions.styled'

const imageByOs: Record<string, string> = {
  Windows: microsoftLogo,
  macOS: appleLogo
}

const DownloadOptions = React.memo((props: DownloadOptionsProps) => {
  const { userAgentData, title, links, redirectPath, hideLogo, downloadCounts } = props

  const getIdentityId = useGetIdentityId()
  const l = useFormatMessage()
  const trackClick = useTrackClick()

  const searchParams = new URLSearchParams(window.location.search)
  const event = searchParams.get('event')
  const os = searchParams.get('os')

  useEffect(() => {
    if (userAgentData && os) {
      normalizeUserAgentArchitectureByOs(userAgentData, os as OperativeSystem)
    }
  }, [userAgentData, os])

  const primaryDownloadOptions: DownloadOptionProps[] = useMemo(() => {
    if (!userAgentData || !links[userAgentData.os.name]) {
      return []
    }

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
  }, [userAgentData, event, links])

  const secondaryDownloadOptions: DownloadOptionProps[] = useMemo(() => {
    if (!userAgentData) {
      return []
    }

    const options: DownloadOptionProps[] = [
      {
        text: OperativeSystem.MACOS,
        image: imageByOs[OperativeSystem.MACOS],
        link: userAgentData.os.name === OperativeSystem.MACOS ? links[OperativeSystem.MACOS].amd64 : links[OperativeSystem.MACOS].arm64,
        arch: userAgentData.os.name === OperativeSystem.MACOS ? 'amd64' : undefined
      }
    ]

    if (userAgentData.os.name === OperativeSystem.MACOS) {
      options.push({
        text: OperativeSystem.WINDOWS,
        image: imageByOs[OperativeSystem.WINDOWS],
        link: links[OperativeSystem.WINDOWS].x64
      })
    }

    return options
  }, [userAgentData, links])

  const onClickDownloadHandler = useCallback(
    async (option: DownloadOptionProps) => {
      const params = { event }

      await downloadWithIdentity({
        os: option.text,
        arch: option.arch,
        fallbackLinks: links,
        queryParams: params,
        getIdentityId
      })

      if (option.redirectOs) {
        const redirectUrl = updateUrlWithLastValue(window.location.href, 'os', option.redirectOs)
        window.location.href = addQueryParamsToUrlString(redirectUrl, params)
        return
      }

      if (redirectPath) {
        const redirectUrl = updateUrlWithLastValue(new URL(redirectPath, window.location.origin).toString(), 'os', option.text)
        const finalUrl = addQueryParamsToUrlString(redirectUrl, {
          arch: option.arch,
          ...params
        })
        setTimeout(() => {
          window.location.href = finalUrl
        }, 3000)
      }
    },
    [redirectPath, event, getIdentityId, links]
  )

  return (
    <DownloadDetail>
      {!hideLogo && <Logo size="huge" />}
      {primaryDownloadOptions.length === 0 && (
        <DownloadUnavailable>
          <DownloadTitle variant="h3">{l('page.download.not_available')}</DownloadTitle>
          <DownloadSubtitle>
            {l('page.download.not_available_subtitle', {
              span: (chunks: React.ReactNode) => <span>{chunks}</span>
            })}
          </DownloadSubtitle>
          <DownloadUnavailableIFrame
            src="https://embeds.beehiiv.com/d7d652da-adc8-422f-9176-4b653a244020?slim=true"
            data-test-id="beehiiv-embed"
            height="52"
            frameBorder="0"
            scrolling="no"
            style={{
              margin: 0,
              borderRadius: '0px !important',
              backgroundColor: 'transparent'
            }}
          />
        </DownloadUnavailable>
      )}
      {primaryDownloadOptions.length > 0 && (
        <>
          {title && (
            <DownloadTitle variant="h2">
              <WrapDecentralandText text={title} />
            </DownloadTitle>
          )}
          <DownloadActions>
            <DownloadButtonsContainer>
              {primaryDownloadOptions.map((option, index) => (
                <DownloadButton
                  key={index}
                  href={option.link!}
                  onClick={(event) => {
                    event.preventDefault()
                    trackClick(event)
                    onClickDownloadHandler(option)
                  }}
                  event={SegmentEvent.Download}
                  place={SectionViewedTrack.Download}
                  endIcon={<DownloadButtonImage src={option.image} />}
                  label={l('page.download.download')}
                  isFullWidth={false}
                />
              ))}
            </DownloadButtonsContainer>
            <DownloadAlternativeContainer>
              {downloadCounts && (
                <DownloadCounts variant="body1">
                  <VerifiedIcon />
                  {l('page.download.total_downloads', {
                    downloads: downloadCounts
                  })}
                </DownloadCounts>
              )}
              <DownloadAlternativeButtonsWrapper>
                {secondaryDownloadOptions.map((option, index) => (
                  <DownloadAlternativeButton
                    variant="text"
                    color="inherit"
                    onClick={(event) => {
                      event.preventDefault()
                      trackClick(event)
                      onClickDownloadHandler(option)
                    }}
                    href={option.link}
                    key={index}
                    startIcon={<DownloadAlternativeButtonImage src={option.image} />}
                  >
                    {option.arch ? `(${l(`page.download.${option.arch}_processors_short`)})` : undefined}
                  </DownloadAlternativeButton>
                ))}
              </DownloadAlternativeButtonsWrapper>
            </DownloadAlternativeContainer>
          </DownloadActions>
        </>
      )}
    </DownloadDetail>
  )
})

export { DownloadOptions }
