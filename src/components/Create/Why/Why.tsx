import { memo } from 'react'
import { useInView } from 'react-intersection-observer'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
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
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <WhySection ref={ref} className={inView ? 'visible' : ''}>
      <WhyTitle>
        <span>{l('component.creators_landing.why.title_hightlight')}</span> {l('component.creators_landing.why.title')}
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
  )
})

export { CreatorsWhy }
