import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { getEnv } from '../../config/env'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { usePageView } from '../../hooks/usePageView'
import { assetUrl } from '../../utils/assetUrl'
import {
  ButtonContainer,
  Card,
  ConfirmButton,
  ConfirmEmailContainer,
  Description,
  Logo,
  Title,
  TurnstileContainer
} from './ConfirmEmailPage.styled'

type EmailConfirmationSource = 'account' | 'credits'

// Cloudflare's "always passes" test key. Used as a fallback so local/dev without
// a configured site key still renders a working widget.
const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA'

const resolveSource = (rawSource: string | null, pathname: string): EmailConfirmationSource | null => {
  if (rawSource === 'account' || rawSource === 'credits') {
    return rawSource
  }
  // Backward compatibility: derive the source from the legacy path when the
  // email link omits the `source` query param.
  if (pathname.includes('/credits-email-confirmed/')) {
    return 'credits'
  }
  if (pathname.includes('/confirm-email')) {
    return 'account'
  }
  return null
}

const ConfirmEmailPage = () => {
  const formatMessage = useFormatMessage()
  const { token } = useParams<{ token: string }>()
  const location = useLocation()
  usePageView()

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const address = searchParams.get('address')
  const source = useMemo(() => resolveSource(searchParams.get('source'), location.pathname), [searchParams, location.pathname])

  const siteKey = getEnv('CLOUDFLARE_TURNSTILE_SITE_KEY') || TURNSTILE_TEST_SITE_KEY
  const isTestKey = siteKey === TURNSTILE_TEST_SITE_KEY

  const turnstileRef = useRef<TurnstileInstance>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [isTurnstileLoaded, setIsTurnstileLoaded] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const previous = document.title
    document.title = formatMessage('page.confirm_email.title')
    return () => {
      document.title = previous
    }
  }, [formatMessage])

  const handleTurnstileSuccess = useCallback((value: string) => {
    setTurnstileToken(value)
    setIsTurnstileLoaded(true)
  }, [])

  const handleTurnstileLoad = useCallback(() => {
    setIsTurnstileLoaded(true)
  }, [])

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken('')
    setIsTurnstileLoaded(false)
  }, [])

  const handleConfirmEmail = useCallback(async () => {
    if (!address || !token || !source || !turnstileToken) {
      return
    }

    setIsConfirming(true)
    setHasError(false)

    const notificationsUrl = getEnv('NOTIFICATIONS_API_URL') ?? 'https://notifications.decentraland.org'

    try {
      const response = await fetch(`${notificationsUrl}/confirm-email`, {
        method: 'PUT',
        headers: { ['Content-Type']: 'application/json' },
        body: JSON.stringify({ address, code: token, turnstileToken, source })
      })

      if (!response.ok) {
        throw new Error(`Email confirmation failed with status ${response.status}`)
      }

      setIsConfirmed(true)
    } catch (error) {
      // Rule 10: log the raw error, surface a generic message to the user.
      console.error('Failed to confirm email', error)
      setHasError(true)
      // Turnstile tokens are single-use; reset the widget and clear the token so
      // a retry solves a fresh challenge instead of re-sending the consumed one.
      setTurnstileToken('')
      turnstileRef.current?.reset()
    } finally {
      setIsConfirming(false)
    }
  }, [address, token, source, turnstileToken])

  const handleRedirect = useCallback(() => {
    if (source === 'credits') {
      window.location.href = getEnv('MARKETPLACE_URL') ?? 'https://market.decentraland.org'
      return
    }
    const homepage = getEnv('DECENTRALAND_HOMEPAGE_URL') ?? 'https://decentraland.org'
    window.location.href = `${homepage}/account`
  }, [source])

  const logo = <Logo src={assetUrl('/dcl-logo.svg')} alt={formatMessage('page.confirm_email.logo_alt')} />

  if (!token) {
    return (
      <ConfirmEmailContainer>
        {logo}
        <Card>
          <Title variant="h2">{formatMessage('page.confirm_email.invalid_link_title')}</Title>
          <Description>{formatMessage('page.confirm_email.invalid_link_description')}</Description>
        </Card>
      </ConfirmEmailContainer>
    )
  }

  if (!source) {
    return (
      <ConfirmEmailContainer>
        {logo}
        <Card>
          <Title variant="h2">{formatMessage('page.confirm_email.invalid_source_title')}</Title>
          <Description>{formatMessage('page.confirm_email.invalid_source_description')}</Description>
        </Card>
      </ConfirmEmailContainer>
    )
  }

  if (!address) {
    return (
      <ConfirmEmailContainer>
        {logo}
        <Card>
          <Title variant="h2">{formatMessage('page.confirm_email.missing_address_title')}</Title>
          <Description>{formatMessage('page.confirm_email.missing_address_description')}</Description>
        </Card>
      </ConfirmEmailContainer>
    )
  }

  const isButtonDisabled = isConfirming || !turnstileToken || (!isTurnstileLoaded && !isTestKey)

  return (
    <ConfirmEmailContainer>
      {logo}
      <Card>
        <Title variant="h2">
          {isConfirmed ? formatMessage('page.confirm_email.heading_confirmed') : formatMessage('page.confirm_email.heading')}
        </Title>
        <Description>
          {isConfirmed
            ? formatMessage(source === 'credits' ? 'page.confirm_email.confirmed_credits' : 'page.confirm_email.confirmed_account')
            : formatMessage(source === 'credits' ? 'page.confirm_email.description_credits' : 'page.confirm_email.description_account')}
        </Description>

        {!isConfirmed && (
          <>
            <TurnstileContainer>
              <Turnstile
                ref={turnstileRef}
                siteKey={siteKey}
                onSuccess={handleTurnstileSuccess}
                onError={handleTurnstileError}
                onWidgetLoad={handleTurnstileLoad}
                options={{ theme: 'dark', size: 'normal', retry: 'auto' }}
              />
            </TurnstileContainer>

            {hasError && <Description role="alert">{formatMessage('page.confirm_email.error_generic')}</Description>}

            <ButtonContainer>
              <ConfirmButton type="button" disabled={isButtonDisabled} onClick={handleConfirmEmail}>
                {isConfirming ? formatMessage('page.confirm_email.confirming_button') : formatMessage('page.confirm_email.confirm_button')}
              </ConfirmButton>
            </ButtonContainer>
          </>
        )}

        {isConfirmed && (
          <ButtonContainer>
            <ConfirmButton type="button" onClick={handleRedirect}>
              {formatMessage(source === 'credits' ? 'page.confirm_email.go_to_marketplace' : 'page.confirm_email.go_to_account')}
            </ConfirmButton>
          </ButtonContainer>
        )}
      </Card>
    </ConfirmEmailContainer>
  )
}

export { ConfirmEmailPage }
