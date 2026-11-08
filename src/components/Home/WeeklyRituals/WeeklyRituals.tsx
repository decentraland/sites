import { memo, useCallback, useState } from 'react'
import { useMediaQuery } from 'decentraland-ui2'
import { weeklyRitualsContent } from '../../../data/static-content'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { SectionViewedTrack, SegmentEvent } from '../../../modules/segment'
import { Carousel } from '../../Carousel'
import type { HomeDetailSelection } from '../HomeDetailModal/HomeDetailModal.types'
import { HomeDetailModalLoader } from '../HomeDetailModal/HomeDetailModalLoader'
import { CardButton, CardImage, MobileCardImage, SectionTitle, WeeklyRitualsContainer, WeeklyRitualsOuter } from './WeeklyRituals.styled'

const cards = weeklyRitualsContent.cards

const WeeklyRituals = memo(() => {
  const l = useFormatMessage()
  const isMobile = useMediaQuery('(max-width: 599px)')
  const onClickHandle = useTrackClick()
  const [selection, setSelection] = useState<HomeDetailSelection | null>(null)
  const closeDetail = useCallback(() => setSelection(null), [])

  return (
    <WeeklyRitualsOuter>
      <WeeklyRitualsContainer>
        <SectionTitle variant="h3">{l('page.home.weekly_rituals.title')}</SectionTitle>
        <Carousel
          items={cards}
          keyExtractor={card => card.id}
          slideAspectRatio="750 / 370"
          renderItem={card => (
            <CardButton
              type="button"
              draggable={false}
              data-place={SectionViewedTrack.LANDING_WEEKLY_RITUALS}
              data-event={SegmentEvent.CLICK}
              data-card={card.id}
              onClick={event => {
                onClickHandle(event)
                setSelection({ kind: 'event', id: card.eventId })
              }}
            >
              {isMobile ? (
                <MobileCardImage src={card.mobileImageUrl} alt={l(card.titleKey)} loading="lazy" draggable={false} />
              ) : (
                <CardImage src={card.imageUrl} alt={l(card.titleKey)} loading="lazy" draggable={false} />
              )}
            </CardButton>
          )}
        />
        <HomeDetailModalLoader selection={selection} onClose={closeDetail} />
      </WeeklyRitualsContainer>
    </WeeklyRitualsOuter>
  )
})

WeeklyRituals.displayName = 'WeeklyRituals'

export { WeeklyRituals }
