import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { DiscordButton, DiscordDescription, DiscordPageContainer, DiscordTitle } from './DiscordPage.styled'

const DISCORD_URL = 'https://dcl.gg/discord'

function DiscordPage() {
  const l = useFormatMessage()

  return (
    <DiscordPageContainer>
      <DiscordTitle>{l('page.discord.title')}</DiscordTitle>
      <DiscordDescription>{l('page.discord.description')}</DiscordDescription>
      <DiscordButton variant="contained" onClick={() => window.open(DISCORD_URL, '_blank', 'noopener,noreferrer')}>
        {l('page.discord.cta')}
      </DiscordButton>
    </DiscordPageContainer>
  )
}

export { DiscordPage }
