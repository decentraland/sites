import { memo, useCallback, useRef } from 'react'
import { Button } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { SectionViewedTrack, SegmentEvent } from '../../../modules/segment'
import { AnimatedSection } from '../AnimatedSection'
import { LightCtaButton } from '../CreateButtons.styled'
import { learnCards } from '../data'
import { PlayIcon } from './PlayIcon'
import {
  LearnCard,
  LearnCardDate,
  LearnCardInfo,
  LearnCardTitle,
  LearnCardUser,
  LearnCardUserImage,
  LearnCardUserName,
  LearnCardUserRow,
  LearnCardVideoImage,
  LearnCardsArea,
  LearnCardsContainer,
  LearnExtraBlock,
  LearnExtraContainer,
  LearnNavNext,
  LearnNavPrev,
  LearnSection,
  LearnTitle
} from './Learn.styled'

const CARD_GAP = 20

const CreatorsLearn = memo(() => {
  const l = useFormatMessage()
  const trackClick = useTrackClick()
  const stripRef = useRef<HTMLDivElement>(null)
  const handleCardClick = useCallback((url: string) => {
    window.open(url, '_blank')
  }, [])

  const scrollByCard = useCallback((direction: 1 | -1) => {
    const strip = stripRef.current
    if (!strip) return
    const cardWidth = strip.firstElementChild?.getBoundingClientRect().width ?? 0
    const step = cardWidth > 0 ? cardWidth + CARD_GAP : strip.clientWidth
    strip.scrollBy({ left: direction * step, behavior: 'smooth' })
  }, [])

  return (
    <AnimatedSection trackPlace={SectionViewedTrack.CREATORS_LEARN}>
      <LearnSection>
        <LearnTitle>
          <span>{l('component.creators_landing.learn.title_highlight')}</span> {l('component.creators_landing.learn.title')}
        </LearnTitle>
        <LearnCardsArea>
          <LearnCardsContainer ref={stripRef}>
            {learnCards.map(card => (
              <LearnCard
                key={card.id}
                onClick={event => {
                  trackClick(event)
                  handleCardClick(card.url)
                }}
                data-place={SectionViewedTrack.CREATORS_LEARN}
                data-event={SegmentEvent.CLICK}
                data-title={card.title}
              >
                <LearnCardVideoImage>
                  <img src={card.image} alt={card.title} />
                  <PlayIcon />
                </LearnCardVideoImage>
                <LearnCardInfo>
                  <LearnCardUserRow>
                    <LearnCardUser>
                      <LearnCardUserImage>
                        <img src={card.userImage} alt={card.name} />
                      </LearnCardUserImage>
                      <LearnCardUserName>{card.name}</LearnCardUserName>
                    </LearnCardUser>
                    <LearnCardDate>{card.date}</LearnCardDate>
                  </LearnCardUserRow>
                  <LearnCardTitle>{card.title}</LearnCardTitle>
                </LearnCardInfo>
              </LearnCard>
            ))}
          </LearnCardsContainer>
          <LearnNavPrev aria-label="Previous videos" onClick={() => scrollByCard(-1)}>
            &#8249;
          </LearnNavPrev>
          <LearnNavNext aria-label="Next videos" onClick={() => scrollByCard(1)}>
            &#8250;
          </LearnNavNext>
        </LearnCardsArea>
        <LearnExtraContainer>
          <LearnExtraBlock sx={{ marginRight: { xs: 0, md: '80px' } }}>
            {l('component.creators_landing.learn.watch_more')}
            <Button
              variant="contained"
              component="a"
              href={l('component.creators_landing.learn.watch_more_target')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackClick}
              data-place={SectionViewedTrack.CREATORS_LEARN}
              data-event={SegmentEvent.CLICK}
              data-title="watch-more"
            >
              {l('component.creators_landing.learn.watch_more_button')}
            </Button>
          </LearnExtraBlock>
          <LearnExtraBlock sx={{ marginTop: { xs: '33px', md: 0 } }}>
            {l('component.creators_landing.learn.your_tutorial')}
            <LightCtaButton
              variant="outlined"
              component="a"
              href={l('component.creators_landing.learn.your_tutorial_target')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackClick}
              data-place={SectionViewedTrack.CREATORS_LEARN}
              data-event={SegmentEvent.CLICK}
              data-title="submit-tutorial"
            >
              {l('component.creators_landing.learn.your_tutorial_button')}
            </LightCtaButton>
          </LearnExtraBlock>
        </LearnExtraContainer>
      </LearnSection>
    </AnimatedSection>
  )
})

export { CreatorsLearn }
