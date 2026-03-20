import { memo } from 'react'
import { AnimatedBackground } from 'decentraland-ui2'
import { useGetWhatsOnCardsQuery } from '../../../features/events/events.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { WhatsOnCard } from './WhatsOnCard'
import { CardsGrid, SectionTitle, WhatsOnContainer } from './WhatsOn.styled'

const WhatsOn = memo(() => {
  const l = useFormatMessage()
  const { data: cards = [] } = useGetWhatsOnCardsQuery(undefined, { pollingInterval: 60000 })

  if (cards.length === 0) return null

  return (
    <WhatsOnContainer>
      <AnimatedBackground variant="absolute" />
      {/* TODO: migrate section title to Contentful */}
      <SectionTitle variant="h3">{l('component.home.whats_on.title')}</SectionTitle>
      <CardsGrid>
        {cards.map(card => (
          <WhatsOnCard key={card.id} card={card} />
        ))}
      </CardsGrid>
    </WhatsOnContainer>
  )
})

WhatsOn.displayName = 'WhatsOn'

export { WhatsOn }
