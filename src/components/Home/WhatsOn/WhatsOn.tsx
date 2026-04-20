import { memo, useCallback, useMemo } from 'react'
import { AnimatedBackground, DownloadModal } from 'decentraland-ui2'
import { useGetWhatsOnDataQuery } from '../../../features/events/events.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useHangOutAction } from '../../../hooks/useHangOutAction'
import { useWalletAddress } from '../../../hooks/useWalletAddress'
import { Carousel } from '../../Carousel/Carousel'
import { WhatsOnCard } from './WhatsOnCard'
import { CardsGrid, MobileCarousel, SectionTitle, WhatsOnContainer } from './WhatsOn.styled'

const LOADING_PLACEHOLDERS = [0, 1, 2]

const WhatsOn = memo(() => {
  const l = useFormatMessage()
  const { data: cards, isLoading } = useGetWhatsOnDataQuery()
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
        ? LOADING_PLACEHOLDERS.map(i => <WhatsOnCard key={i} loading />)
        : cards.map(card => <WhatsOnCard key={card.id} card={card} />),
    [isLoading, cards]
  )

  return (
    <WhatsOnContainer>
      <AnimatedBackground variant="absolute" />
      <SectionTitle variant="h3">{l('page.home.whats_on.title')}</SectionTitle>
      <CardsGrid onClickCapture={handleCardClick}>{cardElements}</CardsGrid>
      <MobileCarousel onClickCapture={handleCardClick}>
        {isLoading ? (
          <WhatsOnCard loading />
        ) : (
          cards.length > 0 && (
            <Carousel items={cards} renderItem={card => <WhatsOnCard card={card} />} keyExtractor={card => card.id} autoplayDelay={5000} />
          )
        )}
      </MobileCarousel>
      <DownloadModal open={isDownloadModalOpen} onClose={closeDownloadModal} {...downloadModalProps} />
    </WhatsOnContainer>
  )
})

WhatsOn.displayName = 'WhatsOn'

export { WhatsOn }
