import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { AccountUnavailableNotice } from '../../AccountUnavailableNotice/AccountUnavailableNotice'

/**
 * Shown on /account/delete when the connected account is NOT a thirdweb in-app wallet. Account
 * deletion runs entirely through the thirdweb SDK (unlink profiles), so it only applies to email /
 * social-OTP logins — self-custodial wallets manage their own keys and have nothing to delete here.
 */
const DeleteAccountUnavailable = () => {
  const t = useFormatMessage()

  return (
    <AccountUnavailableNotice
      title={t('account.delete.unavailable_title')}
      description={t('account.delete.unavailable_description')}
      dataRole="delete-account-unavailable"
    />
  )
}

export { DeleteAccountUnavailable }
