import { memo, useCallback } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import discordImage from '../../../images/discord.svg'
import { AnimatedSection } from '../AnimatedSection'
import { connectCards } from '../data'
import {
  ConnectCard,
  ConnectCardDescription,
  ConnectCardUser,
  ConnectCardUserImage,
  ConnectCardUserName,
  ConnectCardsContainer,
  ConnectSection,
  ConnectTitle,
  DiscordContainer,
  DiscordIcon,
  DiscordTitle
} from './Connect.styled'

const CreatorsConnect = memo(() => {
  const l = useFormatMessage()
  const handleDiscordClick = useCallback(() => window.open(l('general.discord_cta_target'), '_blank'), [l])

  const handleCardClick = useCallback((url?: string) => {
    if (url) window.open(url, '_blank')
  }, [])

  return (
    <AnimatedSection>
      <ConnectSection>
        <ConnectTitle>
          <span>{l('component.creators_landing.connect.title_highlight')}</span> {l('component.creators_landing.connect.title')}
        </ConnectTitle>
        <ConnectCardsContainer>
          {connectCards.map(card => (
            <ConnectCard key={card.id} onClick={() => handleCardClick(card.url)} sx={{ cursor: card.url ? 'pointer' : 'default' }}>
              <ConnectCardDescription>&ldquo;{card.description}&rdquo;</ConnectCardDescription>
              <ConnectCardUser>
                <ConnectCardUserImage>
                  <img src={card.image} alt={card.name} />
                </ConnectCardUserImage>
                <ConnectCardUserName>{card.name}</ConnectCardUserName>
              </ConnectCardUser>
            </ConnectCard>
          ))}
        </ConnectCardsContainer>
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
