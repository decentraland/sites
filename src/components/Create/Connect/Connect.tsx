import { memo, useCallback } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import discordImage from '../../../images/discord.svg'
import { SectionViewedTrack, SegmentEvent } from '../../../modules/segment'
import { Carousel } from '../../Carousel'
import { AnimatedSection } from '../AnimatedSection'
import { connectCards } from '../data'
import type { ConnectCardData } from '../data'
import {
  ConnectCard,
  ConnectCardDescription,
  ConnectCardUser,
  ConnectCardUserImage,
  ConnectCardUserName,
  ConnectSection,
  ConnectTitle,
  DiscordContainer,
  DiscordIcon,
  DiscordTitle
} from './Connect.styled'

const keyExtractor = (card: ConnectCardData) => card.id

const CreatorsConnect = memo(() => {
  const l = useFormatMessage()
  const trackClick = useTrackClick()

  // Rendered per carousel slide; memoized on the stable trackClick so its
  // identity survives re-renders (same intent as the previous module-scope fn).
  const renderCard = useCallback(
    (card: ConnectCardData) => (
      <ConnectCard
        onClick={
          card.url
            ? event => {
                trackClick(event)
                window.open(card.url, '_blank', 'noopener,noreferrer')
              }
            : undefined
        }
        sx={{ cursor: card.url ? 'pointer' : 'default' }}
        data-place={SectionViewedTrack.CREATORS_CONNECT}
        data-event={SegmentEvent.CLICK}
        data-title={card.name}
      >
        <ConnectCardDescription>&ldquo;{card.description}&rdquo;</ConnectCardDescription>
        <ConnectCardUser>
          <ConnectCardUserImage>
            <img src={card.image} alt={card.name} />
          </ConnectCardUserImage>
          <ConnectCardUserName>{card.name}</ConnectCardUserName>
        </ConnectCardUser>
      </ConnectCard>
    ),
    [trackClick]
  )

  return (
    <AnimatedSection trackPlace={SectionViewedTrack.CREATORS_CONNECT}>
      <ConnectSection>
        <ConnectTitle>
          <span>{l('component.creators_landing.connect.title_highlight')}</span> {l('component.creators_landing.connect.title')}
        </ConnectTitle>
        <Carousel
          items={connectCards}
          renderItem={renderCard}
          keyExtractor={keyExtractor}
          slideWidth={500}
          autoplayDelay={5000}
          alignItems="center"
        />
        <DiscordContainer
          onClick={event => {
            trackClick(event)
            window.open(l('general.discord_cta_target'), '_blank', 'noopener,noreferrer')
          }}
          data-place={SectionViewedTrack.CREATORS_CONNECT}
          data-event={SegmentEvent.CLICK}
          data-title="join-discord"
        >
          <DiscordTitle>{l('component.creators_landing.connect.join_the_community')}</DiscordTitle>
          <DiscordIcon>
            <img src={discordImage} alt="Discord" />
          </DiscordIcon>
        </DiscordContainer>
      </ConnectSection>
    </AnimatedSection>
  )
})

export { CreatorsConnect }
