import { memo, useCallback, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
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
  DownloadAlternativeTitle,
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
  [OperativeSystem.WINDOWS]: microsoftLogo,
  [OperativeSystem.MACOS]: appleLogo
}

const DownloadOptions = memo((props: DownloadOptionsProps) => {
  const { userAgentData, title, label, alternativeText, links, redirectPath, hideLogo, downloadCounts, center, withoutIdentity } = props

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

    const options: DownloadOptionProps[] = []

    if (userAgentData.os.name === OperativeSystem.MACOS && links[OperativeSystem.MACOS].amd64) {
      options.push({
        text: OperativeSystem.MACOS,
        image: imageByOs[OperativeSystem.MACOS],
        link: userAgentData.os.name === OperativeSystem.MACOS ? links[OperativeSystem.MACOS].amd64 : links[OperativeSystem.MACOS].arm64,
        arch: userAgentData.os.name === OperativeSystem.MACOS ? 'amd64' : undefined
      })
    }

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

      if (withoutIdentity) {
        if (!option.link) {
          throw new Error('Download link is not available')
        }
        window.location.href = option.link
      } else {
        await downloadWithIdentity({
          os: option.text,
          arch: option.arch,
          fallbackLinks: links,
          queryParams: params,
          getIdentityId
        })
      }

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
    [redirectPath, event, getIdentityId, links, withoutIdentity]
  )

  return (
    <DownloadDetail center={center}>
      {!hideLogo && <Logo size="huge" />}
      {primaryDownloadOptions.length === 0 && (
        <DownloadUnavailable center={center}>
          <DownloadTitle variant="h3" center={center}>
            {l('page.download.not_available')}
          </DownloadTitle>
          <DownloadSubtitle center={center}>
            {l('page.download.not_available_subtitle', {
              span: (chunks: ReactNode) => <span>{chunks}</span>
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
            <DownloadTitle variant="h2" center={center}>
              <WrapDecentralandText text={title} />
            </DownloadTitle>
          )}
          <DownloadActions center={center} sx={hideLogo && !title ? { marginTop: 0 } : undefined}>
            <DownloadButtonsContainer center={center}>
              {primaryDownloadOptions.map((option, index) => (
                <DownloadButton
                  key={index}
                  href={option.link!}
                  onClick={event => {
                    event.preventDefault()
                    trackClick(event)
                    onClickDownloadHandler(option)
                  }}
                  event={SegmentEvent.DOWNLOAD}
                  place={SectionViewedTrack.DOWNLOAD}
                  endIcon={<DownloadButtonImage src={option.image} />}
                  label={label ?? l('page.download.download')}
                  isFullWidth={false}
                />
              ))}
            </DownloadButtonsContainer>
            <DownloadAlternativeContainer center={center}>
              {downloadCounts && (
                <DownloadCounts variant="body1">
                  <VerifiedIcon />
                  {l('page.download.total_downloads', {
                    downloads: downloadCounts
                  })}
                </DownloadCounts>
              )}
              <DownloadAlternativeButtonsWrapper center={center}>
                {alternativeText && <DownloadAlternativeTitle variant="body2">{alternativeText}</DownloadAlternativeTitle>}
                {secondaryDownloadOptions.map((option, index) => (
                  <DownloadAlternativeButton
                    variant="text"
                    color="inherit"
                    onClick={event => {
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
