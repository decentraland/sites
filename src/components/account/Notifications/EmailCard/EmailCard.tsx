import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Email, type SubscriptionDetails } from '@dcl/schemas'
import { CircularProgress, Switch } from 'decentraland-ui2'
import { useSetEmailMutation } from '../../../../features/account-notifications/account-notifications.client'
import { isAllEmailEnabled } from '../../../../features/account-notifications/account-notifications.helpers'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { Card, Description, EmailInput, Heading, HeadingRow, InputRow, SaveButton, StatusBadge } from './EmailCard.styled'

interface EmailCardProps {
  email?: string
  unconfirmedEmail?: string
  details?: SubscriptionDetails
  disabled?: boolean
  onToggleAll?: (enabled: boolean) => void
}

const EmailCard = ({ email = '', unconfirmedEmail, details, disabled = false, onToggleAll }: EmailCardProps) => {
  const t = useFormatMessage()
  const [setEmail, { isLoading, isError, reset }] = useSetEmailMutation()
  const [value, setValue] = useState(unconfirmedEmail || email)
  const [isValid, setIsValid] = useState(true)
  const lastSyncedRef = useRef(unconfirmedEmail || email)

  // Sync the field only when the upstream email actually changes (subscription resolves / address
  // change / confirmation elsewhere) — not on every prop identity change. Guarding against the last
  // synced value preserves an in-progress edit when a background refetch returns the same email.
  useEffect(() => {
    const upstream = unconfirmedEmail || email
    if (upstream && upstream !== lastSyncedRef.current) {
      lastSyncedRef.current = upstream
      setValue(upstream)
    }
  }, [email, unconfirmedEmail])

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value)
      setIsValid(true)
      // Clear a previous server rejection so the generic error disappears as the user edits.
      if (isError) {
        reset()
      }
    },
    [isError, reset]
  )

  const handleSave = useCallback(() => {
    if (!Email.validate(value)) {
      setIsValid(false)
      return
    }
    setIsValid(true)
    void setEmail({ email: value })
  }, [value, setEmail])

  const isConfirmed = !!email && !unconfirmedEmail
  const isPending = !!unconfirmedEmail

  const description = useMemo(() => {
    if (!email && !unconfirmedEmail) return t('account.notifications.email.description.without_email')
    if (isPending) return t('account.notifications.email.description.pending_approval')
    if (isConfirmed) return t('account.notifications.email.description.confirmed')
    return t('account.notifications.email.description.with_email')
  }, [email, unconfirmedEmail, isPending, isConfirmed, t])

  const buttonLabel = useMemo(() => {
    if (!email && !unconfirmedEmail) return t('account.notifications.email.button.submit')
    if (unconfirmedEmail && unconfirmedEmail === value) return t('account.notifications.email.button.resend')
    return t('account.notifications.email.button.save')
  }, [email, unconfirmedEmail, value, t])

  const isSaveDisabled = disabled || isLoading || value === '' || (value === email && !unconfirmedEmail)

  // Surface the client-side format error first, then any server rejection as a generic message
  // (rule 10: the raw server body is not shown to the user).
  const hasError = !isValid || isError
  const helperText = !isValid ? t('account.notifications.email.invalid') : isError ? t('account.notifications.email.error') : undefined

  // `aria-label` is a valid DOM attribute but not camelCase; scope the lint exception to this object.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const masterToggleInputProps = { 'aria-label': t('account.notifications.email.master_label') }

  return (
    <Card data-role="notifications-email-card">
      <HeadingRow>
        <Heading variant="h6">
          {t('account.notifications.email.title')}
          {(isPending || isConfirmed) && (
            <StatusBadge $confirmed={isConfirmed} data-role="notifications-email-status">
              {isConfirmed ? t('account.notifications.email.status.confirmed') : t('account.notifications.email.status.pending')}
            </StatusBadge>
          )}
        </Heading>
        {!!email && details && onToggleAll && (
          <Switch
            checked={isAllEmailEnabled(details)}
            disabled={disabled}
            onChange={(_event, checked) => onToggleAll(checked)}
            inputProps={masterToggleInputProps}
            data-role="notifications-email-master"
          />
        )}
      </HeadingRow>
      <Description data-role="notifications-email-description">{description}</Description>
      <InputRow>
        <EmailInput
          type="email"
          variant="outlined"
          value={value}
          onChange={handleChange}
          placeholder={t('account.notifications.email.placeholder')}
          error={hasError}
          helperText={helperText}
          disabled={disabled || isLoading}
          data-role="notifications-email-input"
        />
        <SaveButton variant="contained" onClick={handleSave} disabled={isSaveDisabled} data-role="notifications-email-submit">
          {isLoading ? <CircularProgress size={20} color="inherit" /> : buttonLabel}
        </SaveButton>
      </InputRow>
    </Card>
  )
}

const MemoizedEmailCard = memo(EmailCard)

export { MemoizedEmailCard as EmailCard }
