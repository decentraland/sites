import { memo, useCallback, useMemo } from 'react'
import { AnimatedBackground, DownloadModal } from 'decentraland-ui2'
import { useGetExploreDataQuery } from '../../../features/events/events.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useHangOutAction } from '../../../hooks/useHangOutAction'
import { useWalletAddress } from '../../../hooks/useWalletAddress'
import { Carousel } from '../../Carousel/Carousel'
import { ExploreCard } from './ExploreCard'
import { CardsGrid, ExploreContainer, MobileCarousel, SectionTitle } from './Explore.styled'

const LOADING_PLACEHOLDERS = [0, 1, 2]

const Explore = memo(() => {
  const l = useFormatMessage()
  const { data: cards = [], isLoading } = useGetExploreDataQuery(undefined, { pollingInterval: 60000 })
  const { isConnected } = useWalletAddress()
  const { handleClick, isDownloadModalOpen, closeDownloadModal, downloadModalProps } = useHangOutAction()

  // Intercept card clicks when not signed in → show download modal instead
  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isConnected) {
        e.preventDefault()
        e.stopPropagation()
        handleClick(e)
      }
    },
    [isConnected, handleClick]
  )

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
      <CardsGrid onClickCapture={handleCardClick}>{cardElements}</CardsGrid>
      <MobileCarousel onClickCapture={handleCardClick}>
        {isLoading ? (
          <ExploreCard loading />
        ) : (
          cards.length > 0 && (
            <Carousel items={cards} renderItem={card => <ExploreCard card={card} />} keyExtractor={card => card.id} autoplayDelay={5000} />
          )
        )}
      </MobileCarousel>
      <DownloadModal open={isDownloadModalOpen} onClose={closeDownloadModal} {...downloadModalProps} />
    </ExploreContainer>
  )
})

Explore.displayName = 'Explore'

export { Explore }
