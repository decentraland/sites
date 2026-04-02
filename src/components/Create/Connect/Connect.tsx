import { memo, useCallback } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import discordImage from '../../../images/discord.svg'
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

const renderCard = (card: ConnectCardData) => (
  <ConnectCard
    onClick={() => {
      if (card.url) window.open(card.url, '_blank', 'noopener,noreferrer')
    }}
    sx={{ cursor: card.url ? 'pointer' : 'default' }}
  >
    <ConnectCardDescription>&ldquo;{card.description}&rdquo;</ConnectCardDescription>
    <ConnectCardUser>
      <ConnectCardUserImage>
        <img src={card.image} alt={card.name} />
      </ConnectCardUserImage>
      <ConnectCardUserName>{card.name}</ConnectCardUserName>
    </ConnectCardUser>
  </ConnectCard>
)

const keyExtractor = (card: ConnectCardData) => card.id

const CreatorsConnect = memo(() => {
  const l = useFormatMessage()
  const handleDiscordClick = useCallback(() => window.open(l('general.discord_cta_target'), '_blank', 'noopener,noreferrer'), [l])

  return (
    <AnimatedSection>
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
        <DiscordContainer onClick={handleDiscordClick}>
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
