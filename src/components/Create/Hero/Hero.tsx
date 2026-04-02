import { memo, useCallback, useMemo } from 'react'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { styled, useDesktopMediaQuery, useMediaQuery } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { Repo, useLatestGithubRelease } from '../../../hooks/useLatestGithubRelease'
import { useTypingListEffect } from '../../../hooks/useTypingListEffect'
import appleLogo from '../../../images/apple-logo.svg'
import microsoftLogo from '../../../images/microsoft-logo.svg'
import { triggerFileDownload } from '../../../modules/file'
import { SectionViewedTrack, SegmentEvent } from '../../../modules/segment'
import { addQueryParamsToUrlString, updateUrlWithLastValue } from '../../../modules/url'
import { OperativeSystem } from '../../../types/download.types'
import type { Architecture } from '../../../types/download.types'
import { CTAButton } from '../../Buttons/CTAButton'
import { Video } from '../../Video'
import { heroData } from '../data'
import { Chevron } from './Chevron'
import { ChevronContainer, HeroActions, HeroBackground, HeroContent, HeroSection, HeroSubtitle, HeroTitle } from './Hero.styled'

const REDIRECT_PATH = '/download/creator-hub-success'
const CREATOR_HUB_DOWNLOAD_URL = '/download/creator-hub'

const imageByOs: Record<string, string> = {
  [OperativeSystem.WINDOWS]: microsoftLogo,
  [OperativeSystem.MACOS]: appleLogo
}

const DownloadButtonImage = styled('img')({
  width: '20px',
  height: '20px',
  filter: 'brightness(0) invert(1)'
})

const AlsoAvailableContainer = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '8px',
  justifyContent: 'center'
})

const AlsoAvailableText = styled('span')({
  fontSize: '14px',
  color: 'rgba(255, 255, 255, 0.7)'
})

const AlternativeIconButton = styled('button')(({ theme }) => ({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  outline: 'none',
  ['&:focus-visible']: {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2
  }
}))

const AlternativeButtonImage = styled('img')({
  width: '20px',
  height: '20px',
  filter: 'brightness(0) invert(1)'
})

type DownloadOption = {
  text: string
  image: string
  link?: string
  arch?: Architecture
}

const CreatorsHero = memo(() => {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const isDesktop = useDesktopMediaQuery()
  const currentWord = useTypingListEffect(heroData.changingWords)
  const trackClick = useTrackClick()
  const l = useFormatMessage()
  const [isLoadingUserAgentData, userAgentData] = useAdvancedUserAgentData()
  const { links, loading: isLoadingLinks } = useLatestGithubRelease(Repo.CREATOR_HUB)

  const primaryOption: DownloadOption | null = useMemo(() => {
    if (!links || !userAgentData) return null

    if (userAgentData.os.name === OperativeSystem.MACOS) {
      return {
        text: OperativeSystem.MACOS,
        image: imageByOs[OperativeSystem.MACOS],
        link: links[OperativeSystem.MACOS]?.arm64 || links[OperativeSystem.MACOS]?.amd64,
        arch: userAgentData.cpu.architecture as Architecture
      }
    }

    if (links[userAgentData.os.name]) {
      return {
        text: userAgentData.os.name,
        image: imageByOs[userAgentData.os.name],
        link: links[userAgentData.os.name]?.[userAgentData.cpu.architecture],
        arch: userAgentData.cpu.architecture as Architecture
      }
    }

    return null
  }, [userAgentData, links])

  const secondaryOptions: DownloadOption[] = useMemo(() => {
    if (!links || !userAgentData) return []

    return Object.keys(links)
      .filter(os => os !== userAgentData.os.name)
      .map(os => {
        const osLinks = links[os]
        const firstArch = Object.keys(osLinks)[0]
        return {
          text: os,
          image: imageByOs[os],
          link: osLinks?.[firstArch],
          arch: firstArch as Architecture
        }
      })
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

  const showDownloadOptions = isDesktop && !isLoadingLinks && links && !isLoadingUserAgentData

  return (
    <>
      <HeroSection>
        <HeroBackground>
          {!isMobile && (
            <Video
              loop
              muted
              autoPlay
              playsInline
              width={heroData.videoLandscape.width}
              height={heroData.videoLandscape.height}
              poster={heroData.imageLandscape.url}
              source={heroData.videoLandscape.url}
            />
          )}
          {isMobile && (
            <Video
              loop
              muted
              autoPlay
              playsInline
              width={heroData.videoPortrait.width}
              height={heroData.videoPortrait.height}
              poster={heroData.imagePortrait.url}
              source={heroData.videoPortrait.url}
            />
          )}
        </HeroBackground>
        <HeroContent>
          <HeroTitle>
            {heroData.titleFirstLine}
            <br />
            <span>{currentWord}</span>
            <br />
            {heroData.titleLastLine}
          </HeroTitle>
          <HeroSubtitle>{heroData.subtitle}</HeroSubtitle>
          <HeroActions>
            {showDownloadOptions && primaryOption ? (
              <>
                <CTAButton
                  href={primaryOption.link!}
                  onClick={event => {
                    event.preventDefault()
                    trackClick(event)
                    handleDownload(primaryOption)
                  }}
                  event={SegmentEvent.DOWNLOAD}
                  place={SectionViewedTrack.CREATORS_HERO}
                  endIcon={<DownloadButtonImage src={primaryOption.image} alt="" />}
                  label={l('page.download.download_creator_hub')}
                  isFullWidth={false}
                />
                {secondaryOptions.length > 0 && (
                  <AlsoAvailableContainer>
                    <AlsoAvailableText>{l('page.creator-hub.download.also_available')}</AlsoAvailableText>
                    {secondaryOptions.map((option, index) => (
                      <AlternativeIconButton
                        key={index}
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
              </>
            ) : (
              <CTAButton
                href={CREATOR_HUB_DOWNLOAD_URL}
                onClick={event => {
                  trackClick(event)
                }}
                event={SegmentEvent.DOWNLOAD}
                place={SectionViewedTrack.CREATORS_HERO}
                label={l('page.download.download_creator_hub')}
                isFullWidth={false}
              />
            )}
          </HeroActions>
        </HeroContent>
      </HeroSection>
      <ChevronContainer>
        <Chevron dark />
      </ChevronContainer>
    </>
  )
})

export { CreatorsHero }
