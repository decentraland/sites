import { memo } from 'react'
import { Logo } from 'decentraland-ui2'
import { CTAButton } from '../../components/Buttons/CTAButton'
import {
  AlsoAvailableContainer,
  AlsoAvailableText,
  AlternativeButtonImage,
  AlternativeIconButton,
  DownloadButtonImage
} from '../../components/Create/DownloadButtons.styled'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../hooks/adapters/useTrackLinkContext'
import { useCreatorHubDownload } from '../../hooks/useCreatorHubDownload'
import bannerImage from '../../images/download/creator-hub/download-creator-hub-banner.png'
import { SectionViewedTrack, SegmentEvent } from '../../modules/segment'
import { BannerImage, CardContainer, DownloadActions, InfoContainer, PageContainer, Title } from './CreatorHubDownload.styled'

const CreatorHubDownload = memo(() => {
  const l = useFormatMessage()
  const trackClick = useTrackClick()
  const { isReady, primaryOption, secondaryOptions, handleDownload } = useCreatorHubDownload()

  if (!isReady) return null

  return (
    <PageContainer>
      <CardContainer>
        <InfoContainer>
          <Logo size="normal" />
          <Title variant="h3">{l('page.creator-hub.download.title')}</Title>
          {primaryOption?.link && (
            <DownloadActions>
              <CTAButton
                href={primaryOption.link}
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
                  {secondaryOptions.map(option => (
                    <AlternativeIconButton
                      key={option.text}
                      onClick={event => {
                        event.preventDefault()
                        trackClick(event)
                        handleDownload(option)
                      }}
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
