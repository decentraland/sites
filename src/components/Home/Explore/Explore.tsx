import { memo, useMemo } from 'react'
import { AnimatedBackground } from 'decentraland-ui2'
import { useGetExploreDataQuery } from '../../../features/events/events.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { Carousel } from '../../Carousel/Carousel'
import { ExploreCard } from './ExploreCard'
import { CardsGrid, ExploreContainer, MobileCarousel, SectionTitle } from './Explore.styled'

const LOADING_PLACEHOLDERS = [0, 1, 2]

const Explore = memo(() => {
  const l = useFormatMessage()
  const { data: cards = [], isLoading } = useGetExploreDataQuery(undefined, { pollingInterval: 60000 })

  if (!isLoading && cards.length === 0) return null

  const cardElements = useMemo(
    () =>
      isLoading
        ? LOADING_PLACEHOLDERS.map(i => <ExploreCard key={i} loading />)
        : cards.map(card => <ExploreCard key={card.id} card={card} />),
    [isLoading, cards]
  )

  return (
    <ExploreContainer>
      <AnimatedBackground variant="absolute" />
      <SectionTitle variant="h3">{l('page.home.explore.title')}</SectionTitle>
      <CardsGrid>{cardElements}</CardsGrid>
      <MobileCarousel>
        {isLoading ? (
          <ExploreCard loading />
        ) : (
          cards.length > 0 && (
            <Carousel items={cards} renderItem={card => <ExploreCard card={card} />} keyExtractor={card => card.id} autoplayDelay={5000} />
          )
        )}
      </MobileCarousel>
    </ExploreContainer>
  )
})

Explore.displayName = 'Explore'

export { Explore }
