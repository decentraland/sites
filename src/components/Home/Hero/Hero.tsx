import { memo, useCallback } from 'react'
import { JumpInIcon } from 'decentraland-ui2'
import { getEnv } from '../../../config/env'
import { heroContent } from '../../../data/static-content'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { SectionViewedTrack } from '../../../modules/segment'
import { assetUrl } from '../../../utils/assetUrl'
import {
  GradientBottom,
  GradientTop,
  HangOutButton,
  HeroBackground,
  HeroContainer,
  HeroContent,
  HeroTitle,
  JumpInIconWrapper
} from './Hero.styled'

const Hero = memo(({ isDesktop }: { isDesktop: boolean }) => {
  const onClickHandle = useTrackClick()

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      onClickHandle(event)
      const href = getEnv('ONBOARDING_URL')!
      setTimeout(() => {
        window.location.href = href
      }, 500)
    },
    [onClickHandle]
  )

  return (
    <HeroContainer>
      <HeroBackground>
        <video autoPlay loop muted playsInline poster={assetUrl('/landing_hero.webp')} preload="none">
          <source src={heroContent.backgroundVideo} type="video/mp4" />
        </video>
      </HeroBackground>
      <GradientTop />
      <GradientBottom />
      <HeroContent>
        <HeroTitle variant={isDesktop ? 'h2' : 'h3'}>{heroContent.title}</HeroTitle>
        <HangOutButton
          variant="contained"
          data-place={SectionViewedTrack.LANDING_HERO}
          data-event="click"
          onClick={handleClick}
          endIcon={
            <JumpInIconWrapper>
              <JumpInIcon />
            </JumpInIconWrapper>
          }
        >
          HANG OUT NOW
        </HangOutButton>
      </HeroContent>
    </HeroContainer>
  )
})

Hero.displayName = 'Hero'

export { Hero }
