import { memo } from 'react'
import { DownloadModal, JumpInIcon } from 'decentraland-ui2'
import { heroContent } from '../../../data/static-content'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { useHangOutAction } from '../../../hooks/useHangOutAction'
import { SectionViewedTrack } from '../../../modules/segment'
import { assetUrl } from '../../../utils/assetUrl'
import { GradientBottom, GradientTop, HangOutButton, HeroBackground, HeroContainer, HeroContent, HeroTitle } from './Hero.styled'

const heroImageDesktop = assetUrl('/landing_hero.webp')
const heroImageMobile = assetUrl('/hero_mobile.webp')

const Hero = memo(({ isDesktop }: { isDesktop: boolean }) => {
  const l = useFormatMessage()
  const onClickHandle = useTrackClick()
  const { handleClick, isDownloadModalOpen, closeDownloadModal, downloadModalProps } = useHangOutAction()

  const heroImage = isDesktop ? heroImageDesktop : heroImageMobile

  return (
    <HeroContainer>
      <HeroBackground>
        {isDesktop ? (
          <video autoPlay loop muted playsInline poster={heroImage} preload="none">
            <source src={heroContent.backgroundVideo} type="video/mp4" />
          </video>
        ) : (
          <img src={heroImage} alt="" />
        )}
      </HeroBackground>
      <GradientTop />
      <GradientBottom />
      <HeroContent>
        <HeroTitle variant={isDesktop ? 'h2' : 'h3'}>{l('page.home.hero.title')}</HeroTitle>
        <HangOutButton
          variant="contained"
          data-place={SectionViewedTrack.LANDING_HERO}
          data-event="click"
          onClick={e => {
            onClickHandle(e)
            handleClick(e)
          }}
          endIcon={<JumpInIcon />}
        >
          {l('page.home.hang_out_now')}
        </HangOutButton>
      </HeroContent>
      <DownloadModal open={isDownloadModalOpen} onClose={closeDownloadModal} {...downloadModalProps} />
    </HeroContainer>
  )
})

Hero.displayName = 'Hero'

export { Hero }
