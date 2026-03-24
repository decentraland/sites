import { memo } from 'react'
import { AnimatedBackground } from 'decentraland-ui2'
import { useGetWhatsOnCardsQuery } from '../../../features/events/events.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { WhatsOnCard } from './WhatsOnCard'
import { CardsGrid, SectionTitle, WhatsOnContainer } from './WhatsOn.styled'

const LOADING_PLACEHOLDERS = [0, 1, 2]

const WhatsOn = memo(() => {
  const l = useFormatMessage()
  const { data: cards = [], isLoading } = useGetWhatsOnCardsQuery(undefined, { pollingInterval: 60000 })

  if (!isLoading && cards.length === 0) return null

  return (
    <WhatsOnContainer>
      <AnimatedBackground variant="absolute" />
      {/* TODO: migrate section title to Contentful */}
      <SectionTitle variant="h3">{l('component.home.whats_on.title')}</SectionTitle>
      <CardsGrid>
        {isLoading
          ? LOADING_PLACEHOLDERS.map(i => <WhatsOnCard key={i} loading />)
          : cards.map(card => <WhatsOnCard key={card.id} card={card} />)}
      </CardsGrid>
    </WhatsOnContainer>
  )
})

WhatsOn.displayName = 'WhatsOn'

export { WhatsOn }
