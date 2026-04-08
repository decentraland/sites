import { useCallback, useRef, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention, import/no-named-as-default
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { getEnv } from '../../config/env'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { DiscordButton, DiscordDescription, DiscordError, DiscordPageContainer, DiscordTitle } from './DiscordPage.styled'

const HCAPTCHA_SITEKEY = getEnv('HCAPTCHA_SITEKEY') ?? '00c95ced-f512-4498-a5f2-7e0b0950d456'
const DISCORD_CAPTCHA_URL = getEnv('DISCORD_CAPTCHA_URL') ?? 'https://discord-lambdas.decentraland.io/captcha'
const DISCORD_INVITE_CODE_REGEX = /^[a-zA-Z0-9-]+$/

interface DiscordCaptchaResponse {
  code?: string
}

function DiscordPage() {
  const l = useFormatMessage()
  const [invitation, setInvitation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const captchaRef = useRef<HCaptcha>(null)

  const handleVerify = useCallback(async (token: string) => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(DISCORD_CAPTCHA_URL, {
        method: 'POST',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { 'Content-Type': 'application/json' },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        body: JSON.stringify({ 'captcha-response': token }),
        signal: AbortSignal.timeout(8000)
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body: DiscordCaptchaResponse = await res.json()
      const code = body.code
      if (!code || !DISCORD_INVITE_CODE_REGEX.test(code)) throw new Error('Invalid invite code')
      setInvitation(`https://discord.com/invite/${code}`)
    } catch {
      setError(true)
      captchaRef.current?.resetCaptcha()
    } finally {
      setLoading(false)
    }
  }, [])

  const handleCaptchaError = useCallback(() => {
    setError(true)
    captchaRef.current?.resetCaptcha()
  }, [])

  const showCaptcha = !invitation && !loading

  return (
    <DiscordPageContainer>
      <DiscordTitle>{l('page.discord.title')}</DiscordTitle>
      <DiscordDescription>{l('page.discord.description')}</DiscordDescription>
      {showCaptcha && (
        <HCaptcha
          ref={captchaRef}
          sitekey={HCAPTCHA_SITEKEY}
          onVerify={handleVerify}
          onError={handleCaptchaError}
          onExpire={handleCaptchaError}
        />
      )}
      {error && <DiscordError>{l('page.discord.error')}</DiscordError>}
      {invitation && (
        <DiscordButton href={invitation} target="_blank" rel="noopener noreferrer">
          {l('page.discord.cta')}
        </DiscordButton>
      )}
      {loading && (
        <DiscordButton as="span" data-loading>
          {l('page.discord.cta')}
        </DiscordButton>
      )}
    </DiscordPageContainer>
  )
}

export { DiscordPage }
