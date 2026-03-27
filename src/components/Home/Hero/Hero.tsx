import { memo, useEffect, useState } from 'react'
import { DownloadModal, JumpInIcon } from 'decentraland-ui2'
import { heroContent } from '../../../data/static-content'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { useHangOutAction } from '../../../hooks/useHangOutAction'
import { SectionViewedTrack } from '../../../modules/segment'
import { assetUrl } from '../../../utils/assetUrl'
import { GradientBottom, GradientTop, HangOutButton, HeroBackground, HeroContainer, HeroContent, HeroTitle } from './Hero.styled'

const heroImageUrl = assetUrl('/landing_hero.webp')

const Hero = memo(({ isDesktop }: { isDesktop: boolean }) => {
  const onClickHandle = useTrackClick()
  const { handleClick, isDownloadModalOpen, closeDownloadModal, downloadModalProps } = useHangOutAction()

  // On mobile: show poster image first for fast LCP, defer video load after paint.
  // On desktop: load video immediately (bandwidth is not constrained).
  const [showVideo, setShowVideo] = useState(isDesktop)
  useEffect(() => {
    if (!isDesktop) {
      const id = requestIdleCallback(() => setShowVideo(true), { timeout: 3000 })
      return () => cancelIdleCallback(id)
    }
  }, [isDesktop])

  return (
    <HeroContainer>
      <HeroBackground>
        {showVideo ? (
          <video autoPlay loop muted playsInline poster={heroImageUrl} preload="none">
            <source src={heroContent.backgroundVideo} type="video/mp4" />
          </video>
        ) : (
          <img src={heroImageUrl} alt="" />
        )}
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
