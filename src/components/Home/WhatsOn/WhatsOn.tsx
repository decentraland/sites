import { memo, useMemo } from 'react'
import { AnimatedBackground } from 'decentraland-ui2'
import { useGetWhatsOnDataQuery } from '../../../features/events/events.client'
import { buildWhatsOnCards } from '../../../features/events/events.helpers'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { WhatsOnCard } from './WhatsOnCard'
import { CardsGrid, SectionTitle, WhatsOnContainer } from './WhatsOn.styled'

const LOADING_PLACEHOLDERS = [0, 1, 2]

const WhatsOn = memo(() => {
  const l = useFormatMessage()
  const { data, isLoading } = useGetWhatsOnDataQuery(undefined, { pollingInterval: 60000 })

  const cards = useMemo(() => {
    if (!data) return []
    return buildWhatsOnCards(data.liveEvents, data.hotScenes)
  }, [data])

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
