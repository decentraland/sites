import { memo } from 'react'
import { DownloadModal, JumpInIcon } from 'decentraland-ui2'
import { heroContent } from '../../../data/static-content'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { useHangOutAction } from '../../../hooks/useHangOutAction'
import { SectionViewedTrack } from '../../../modules/segment'
import { assetUrl } from '../../../utils/assetUrl'
import { GradientBottom, GradientTop, HangOutButton, HeroBackground, HeroContainer, HeroContent, HeroTitle } from './Hero.styled'

const Hero = memo(({ isDesktop }: { isDesktop: boolean }) => {
  const onClickHandle = useTrackClick()
  const { handleClick, isDownloadModalOpen, closeDownloadModal, downloadModalProps } = useHangOutAction()

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
          onClick={e => {
            onClickHandle(e)
            handleClick(e)
          }}
          endIcon={<JumpInIcon />}
        >
          HANG OUT NOW
        </HangOutButton>
      </HeroContent>
      <DownloadModal open={isDownloadModalOpen} onClose={closeDownloadModal} {...downloadModalProps} />
    </HeroContainer>
  )
})

Hero.displayName = 'Hero'

export { Hero }
