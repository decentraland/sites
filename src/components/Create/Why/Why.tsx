import { memo } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { SectionViewedTrack, SegmentEvent } from '../../../modules/segment'
import { AnimatedSection } from '../AnimatedSection'
import { whyCards } from '../data'
import {
  WhyCard,
  WhyCardButton,
  WhyCardDescription,
  WhyCardImageContainer,
  WhyCardInner,
  WhyCardText,
  WhyCardTitle,
  WhyGrid,
  WhySection,
  WhyTitle
} from './Why.styled'

const CreatorsWhy = memo(() => {
  const l = useFormatMessage()
  const trackClick = useTrackClick()
  return (
    <AnimatedSection trackPlace={SectionViewedTrack.CREATORS_WHY}>
      <WhySection>
        <WhyTitle>
          <span>{l('component.creators_landing.why.title_highlight')}</span> {l('component.creators_landing.why.title')}
        </WhyTitle>
        <WhyGrid>
          {whyCards.map(card => (
            <WhyCard
              key={card.id}
              cardId={card.id}
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackClick}
              data-place={SectionViewedTrack.CREATORS_WHY}
              data-event={SegmentEvent.CLICK}
              data-title={card.title}
            >
              <WhyCardInner>
                <WhyCardImageContainer>
                  <img src={card.image} alt={card.title} />
                </WhyCardImageContainer>
                <WhyCardText>
                  <WhyCardTitle>{card.title}</WhyCardTitle>
                  <WhyCardDescription>{card.description}</WhyCardDescription>
                  <WhyCardButton>{card.buttonLabel}</WhyCardButton>
                </WhyCardText>
              </WhyCardInner>
            </WhyCard>
          ))}
        </WhyGrid>
      </WhySection>
    </AnimatedSection>
  )
})

export { CreatorsWhy }
