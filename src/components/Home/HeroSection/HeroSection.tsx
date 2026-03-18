import { memo } from 'react'
import { useWallet } from '@dcl/core-web3'
import { DownloadOptions } from '../../DownloadOptions'
import { JumpIn } from '../../JumpIn'
import type { HeroSectionProps } from './HeroSection.types'
import { HeroBackground, HeroContainer, HeroContent, HeroOverlay, HeroSubtitle, HeroTitle } from './HeroSection.styled'

const HeroSection = memo(({ hero, isDesktop }: HeroSectionProps) => {
  const backgroundImage = isDesktop ? hero.imageLandscape?.url : hero.imagePortrait?.url
  const backgroundVideo = isDesktop ? hero.videoLandscape?.url : hero.videoPortrait?.url
  const { isConnected } = useWallet()

  return (
    <HeroContainer>
      {(backgroundVideo || backgroundImage) && (
        <HeroBackground>
          {backgroundVideo ? (
            <video autoPlay loop muted playsInline poster={backgroundImage}>
              <source src={backgroundVideo} type={hero.videoLandscape?.mimeType || 'video/mp4'} />
            </video>
          ) : (
            <img src={backgroundImage} alt="" />
          )}
        </HeroBackground>
      )}
      <HeroOverlay />
      <HeroContent>
        <HeroTitle variant="h2">{hero.title}</HeroTitle>
        {hero.subtitle?.text && <HeroSubtitle variant="h4">{hero.subtitle.text}</HeroSubtitle>}
        {isConnected ? <DownloadOptions /> : <JumpIn isDesktop={isDesktop} hideAlreadyUser hideDownloadCounts />}
      </HeroContent>
    </HeroContainer>
  )
})

HeroSection.displayName = 'HeroSection'

export { HeroSection }
