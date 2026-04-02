import { useCallback, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { DiscordButton, DiscordCaptchaWrapper, DiscordDescription, DiscordPageContainer, DiscordTitle } from './DiscordPage.styled'

const HCAPTCHA_SITEKEY = '00c95ced-f512-4498-a5f2-7e0b0950d456'
const DISCORD_CAPTCHA_URL = 'https://discord-lambdas.decentraland.io/captcha'

function DiscordPage() {
  const l = useFormatMessage()
  const [invitation, setInvitation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleVerify = useCallback(async (token: string) => {
    setLoading(true)
    const res = await fetch(DISCORD_CAPTCHA_URL, {
      method: 'POST',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      body: JSON.stringify({ 'captcha-response': token })
    })
    const body = await res.json()
    setInvitation(`https://discord.com/invite/${body.code}`)
    setLoading(false)
  }, [])

  return (
    <DiscordPageContainer>
      <DiscordTitle>{l('page.discord.title')}</DiscordTitle>
      <DiscordDescription>{l('page.discord.description')}</DiscordDescription>
      {!invitation && !loading && (
        <DiscordCaptchaWrapper>
          <HCaptcha sitekey={HCAPTCHA_SITEKEY} onVerify={handleVerify} />
        </DiscordCaptchaWrapper>
      )}
      {(invitation || loading) && (
        <DiscordButton href={invitation || ''} target="_blank" rel="noopener noreferrer" data-loading={loading || undefined}>
          {l('page.discord.cta')}
        </DiscordButton>
      )}
    </DiscordPageContainer>
  )
}

export { DiscordPage }
