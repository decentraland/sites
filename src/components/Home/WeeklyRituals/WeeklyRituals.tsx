import { memo } from 'react'
import { useMediaQuery } from 'decentraland-ui2'
import { weeklyRitualsContent } from '../../../data/static-content'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { SectionViewedTrack } from '../../../modules/segment'
import { Carousel } from '../../Carousel'
import { CardImage, MobileCardImage, SectionTitle, WeeklyRitualsContainer, WeeklyRitualsOuter } from './WeeklyRituals.styled'

const cards = weeklyRitualsContent.cards

const WeeklyRituals = memo(() => {
  const l = useFormatMessage()
  const isMobile = useMediaQuery('(max-width: 599px)')
  const onClickHandle = useTrackClick()

  return (
    <WeeklyRitualsOuter>
      <WeeklyRitualsContainer>
        <SectionTitle variant="h3">{l('page.home.weekly_rituals.title')}</SectionTitle>
        <Carousel
          items={cards}
          keyExtractor={card => card.id}
          slideAspectRatio="750 / 370"
          renderItem={card => (
            <a
              href={card.link}
              target="_blank"
              rel="noopener noreferrer"
              draggable={false}
              style={{ display: 'block', height: '100%' }}
              data-place={SectionViewedTrack.LANDING_WEEKLY_RITUALS}
              data-event="click"
              data-card={card.id}
              onClick={onClickHandle}
            >
              {isMobile ? (
                <MobileCardImage src={card.mobileImageUrl} alt={l(card.titleKey)} loading="lazy" draggable={false} />
              ) : (
                <CardImage src={card.imageUrl} alt={l(card.titleKey)} loading="lazy" draggable={false} />
              )}
            </a>
          )}
        />
      </WeeklyRitualsContainer>
    </WeeklyRitualsOuter>
  )
})

WeeklyRituals.displayName = 'WeeklyRituals'

export { WeeklyRituals }
