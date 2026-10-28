import { memo, useCallback, useMemo, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { AnimatedBackground, DownloadModal } from 'decentraland-ui2'
import { useGetWhatsOnDataQuery } from '../../../features/events/events.discovery'
import type { ExploreItem } from '../../../features/events/events.discovery.types'
import { DEFAULT_POSITION } from '../../../features/places/places.helpers'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { useLaunchExplorer } from '../../../hooks/useLaunchExplorer'
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

  // One launcher and one DownloadModal for every card, rendered below as a sibling of the cards so the
  // modal does not live inside the carousel's React subtree (its mouse events would bubble into the drag
  // handler). `launchExplorerAt` runs synchronously inside the click, which the protocol launch needs.
  const { launchExplorerAt, isMobile, isDownloadModalOpen, closeDownloadModal, downloadModalProps } = useLaunchExplorer({
    position: DEFAULT_POSITION
  })
  const handleJumpIn = useCallback(
    (card: ExploreItem) => {
      void launchExplorerAt({ position: card.coordinates })
    },
    [launchExplorerAt]
  )

  // NOTE: 2026-10-23 — signed-out clicks used to be intercepted here (`onClickCapture`) to open the download
  // modal, and a signed-in click fell through to ui2's `window.open` of the jump URL in a new tab. Both are
  // gone on purpose: a card now opens its detail in place for every user, and Jump In keeps the launcher +
  // DownloadModal fallback (below). The gate is not meant to return; the download prompt is the Jump In
  // fallback now, not the card click.

  const cardElements = useMemo(
    () =>
      isLoading
        ? LOADING_PLACEHOLDERS.map(i => <WhatsOnCard key={i} loading />)
        : cards.map(card => <WhatsOnCard key={card.id} card={card} onSelect={handleSelect} onJumpIn={handleJumpIn} />),
    [isLoading, cards, handleSelect, handleJumpIn]
  )

  if (!isLoading && cards.length === 0) return null

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
              renderItem={card => <WhatsOnCard card={card} onSelect={handleSelect} onJumpIn={handleJumpIn} />}
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
      {!isMobile && <DownloadModal open={isDownloadModalOpen} onClose={closeDownloadModal} {...downloadModalProps} />}
      <HomeDetailModalLoader selection={selection} onClose={closeDetail} />
    </WhatsOnContainer>
  )
})

WhatsOn.displayName = 'WhatsOn'

export { WhatsOn }
