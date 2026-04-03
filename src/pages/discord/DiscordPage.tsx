import { useCallback, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { DiscordButton, DiscordDescription, DiscordError, DiscordPageContainer, DiscordTitle } from './DiscordPage.styled'

const HCAPTCHA_SITEKEY = '00c95ced-f512-4498-a5f2-7e0b0950d456'
const DISCORD_CAPTCHA_URL = 'https://discord-lambdas.decentraland.io/captcha'
const DISCORD_INVITE_CODE_REGEX = /^[a-zA-Z0-9-]+$/

interface DiscordCaptchaResponse {
  code?: string
}

function DiscordPage() {
  const l = useFormatMessage()
  const [invitation, setInvitation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const handleVerify = useCallback(async (token: string) => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(DISCORD_CAPTCHA_URL, {
        method: 'POST',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { 'Content-Type': 'application/json' },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        body: JSON.stringify({ 'captcha-response': token })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body: DiscordCaptchaResponse = await res.json()
      const code = body.code
      if (!code || !DISCORD_INVITE_CODE_REGEX.test(code)) throw new Error('Invalid invite code')
      setInvitation(`https://discord.com/invite/${code}`)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <DiscordPageContainer>
      <DiscordTitle>{l('page.discord.title')}</DiscordTitle>
      <DiscordDescription>{l('page.discord.description')}</DiscordDescription>
      {!invitation && !loading && <HCaptcha sitekey={HCAPTCHA_SITEKEY} onVerify={handleVerify} />}
      {error && <DiscordError>{l('page.discord.error')}</DiscordError>}
      {(invitation || loading) && (
        <DiscordButton href={invitation || ''} target="_blank" rel="noopener noreferrer" data-loading={loading || undefined}>
          {l('page.discord.cta')}
        </DiscordButton>
      )}
    </DiscordPageContainer>
  )
}

export { DiscordPage }
