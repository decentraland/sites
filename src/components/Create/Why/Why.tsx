import { memo } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { SectionViewedTrack } from '../../../modules/segment'
import { AnimatedSection } from '../AnimatedSection'
import { whyCards } from '../data'
import {
  WhyCard,
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
  return (
    <AnimatedSection trackPlace={SectionViewedTrack.CREATORS_WHY}>
      <WhySection>
        <WhyTitle>
          <span>{l('component.creators_landing.why.title_highlight')}</span> {l('component.creators_landing.why.title')}
        </WhyTitle>
        <WhyGrid>
          {whyCards.map(card => (
            <WhyCard key={card.id} cardId={card.id}>
              <WhyCardInner>
                <WhyCardImageContainer>
                  <img src={card.image} alt={card.title} />
                </WhyCardImageContainer>
                <WhyCardText>
                  <WhyCardTitle>{card.title}</WhyCardTitle>
                  <WhyCardDescription>{card.description}</WhyCardDescription>
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
