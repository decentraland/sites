import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Email } from '@dcl/schemas'
import { CircularProgress } from 'decentraland-ui2'
import { useSetEmailMutation } from '../../../../features/account-notifications/account-notifications.client'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { Card, Description, EmailInput, Heading, InputRow, SaveButton, StatusBadge } from './EmailCard.styled'

interface EmailCardProps {
  email?: string
  unconfirmedEmail?: string
  disabled?: boolean
}

const EmailCard = ({ email = '', unconfirmedEmail, disabled = false }: EmailCardProps) => {
  const t = useFormatMessage()
  const [setEmail, { isLoading }] = useSetEmailMutation()
  const [value, setValue] = useState(unconfirmedEmail || email)
  const [isValid, setIsValid] = useState(true)

  // Keep the field in sync once the subscription resolves (or after an address change).
  useEffect(() => {
    if (unconfirmedEmail || email) {
      setValue(unconfirmedEmail || email)
    }
  }, [email, unconfirmedEmail])

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value)
    setIsValid(true)
  }, [])

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

  return (
    <Card data-role="notifications-email-card">
      <Heading variant="h6">
        {t('account.notifications.email.title')}
        {(isPending || isConfirmed) && (
          <StatusBadge $confirmed={isConfirmed} data-role="notifications-email-status">
            {isConfirmed ? t('account.notifications.email.status.confirmed') : t('account.notifications.email.status.pending')}
          </StatusBadge>
        )}
      </Heading>
      <Description data-role="notifications-email-description">{description}</Description>
      <InputRow>
        <EmailInput
          type="email"
          variant="outlined"
          value={value}
          onChange={handleChange}
          placeholder={t('account.notifications.email.placeholder')}
          error={!isValid}
          helperText={!isValid ? t('account.notifications.email.invalid') : undefined}
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
