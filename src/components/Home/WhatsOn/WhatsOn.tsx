import { memo, useCallback, useMemo, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { AnimatedBackground } from 'decentraland-ui2'
import { useGetWhatsOnDataQuery } from '../../../features/events/events.discovery'
import type { ExploreItem } from '../../../features/events/events.discovery.types'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { SectionViewedTrack, SegmentEvent } from '../../../modules/segment'
import { Carousel } from '../../Carousel/Carousel'
import { selectionFromExploreItem } from '../HomeDetailModal/HomeDetailModal.helpers'
import type { HomeDetailSelection } from '../HomeDetailModal/HomeDetailModal.types'
import { HomeDetailModalLoader } from '../HomeDetailModal/HomeDetailModalLoader'
import { WhatsOnCard } from './WhatsOnCard'
import { CardsGrid, MobileCarousel, SectionTitle, ViewAllButton, WhatsOnContainer } from './WhatsOn.styled'

const LOADING_PLACEHOLDERS = [0, 1, 2]

const WhatsOn = memo(() => {
  const l = useFormatMessage()
  const trackClick = useTrackClick()
  const { data: cards, isLoading } = useGetWhatsOnDataQuery()
  const [selection, setSelection] = useState<HomeDetailSelection | null>(null)

  const handleSelect = useCallback((card: ExploreItem) => setSelection(selectionFromExploreItem(card)), [])
  const closeDetail = useCallback(() => setSelection(null), [])

  if (!isLoading && cards.length === 0) return null

  const cardElements = useMemo(
    () =>
      isLoading
        ? LOADING_PLACEHOLDERS.map(i => <WhatsOnCard key={i} loading />)
        : cards.map(card => <WhatsOnCard key={card.id} card={card} onSelect={handleSelect} />),
    [isLoading, cards, handleSelect]
  )

  return (
    <WhatsOnContainer>
      <AnimatedBackground variant="absolute" />
      <SectionTitle variant="h3">{l('page.home.whats_on.title')}</SectionTitle>
      <CardsGrid>{cardElements}</CardsGrid>
      <MobileCarousel>
        {isLoading ? (
          <WhatsOnCard loading />
        ) : (
          cards.length > 0 && (
            <Carousel
              items={cards}
              renderItem={card => <WhatsOnCard card={card} onSelect={handleSelect} />}
              keyExtractor={card => card.id}
              autoplayDelay={5000}
            />
          )
        )}
      </MobileCarousel>
      <ViewAllButton
        to="/events"
        data-place={SectionViewedTrack.LANDING_EXPLORE}
        data-event={SegmentEvent.CLICK}
        data-section="view_all"
        onClick={trackClick}
      >
        {l('page.home.whats_on.view_all')}
        <ChevronRightIcon />
      </ViewAllButton>
      <HomeDetailModalLoader selection={selection} onClose={closeDetail} />
    </WhatsOnContainer>
  )
})

WhatsOn.displayName = 'WhatsOn'

export { WhatsOn }
