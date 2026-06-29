import { useCallback, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { DeleteAccountConfirmModal } from '../../components/account/DeleteAccount/DeleteAccountConfirmModal/DeleteAccountConfirmModal'
import { DeleteAccountSection } from '../../components/account/DeleteAccount/DeleteAccountSection/DeleteAccountSection'
import { DeleteAccountUnavailable } from '../../components/account/DeleteAccount/DeleteAccountUnavailable/DeleteAccountUnavailable'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useIsMagicAccount } from '../../hooks/useIsMagicAccount'
import { useIsThirdwebAccount } from '../../hooks/useIsThirdwebAccount'
import { PageRoot } from './DeleteAccountPage.styled'

const DeleteAccountPage = () => {
  const t = useFormatMessage()
  const navigate = useNavigate()
  const { address } = useAuthIdentity()
  // Deletion applies to web2 logins: thirdweb in-app (email / social-OTP) wallets delete client-side
  // via the SDK, and Magic logins delete via the auth-server. Self-custodial logins (MetaMask /
  // WalletConnect) have no account to delete, so they see an explanatory message instead.
  const isThirdweb = useIsThirdwebAccount()
  const isMagic = useIsMagicAccount()
  const canDelete = isThirdweb || isMagic
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const handleOpenConfirmModal = useCallback(() => setIsConfirmOpen(true), [])
  const handleCloseConfirmModal = useCallback(() => setIsConfirmOpen(false), [])
  const handleGoToWallets = useCallback(() => navigate('/account/wallets'), [navigate])

  return (
    <>
      <Helmet>
        <title>{`${t('account.pages.delete.title')} | Decentraland`}</title>
      </Helmet>
      <PageRoot>
        {canDelete ? (
          <>
            <DeleteAccountSection address={address} onOpenConfirmModal={handleOpenConfirmModal} onGoToWallets={handleGoToWallets} />
            <DeleteAccountConfirmModal open={isConfirmOpen} address={address} isMagic={isMagic} onClose={handleCloseConfirmModal} />
          </>
        ) : (
          <DeleteAccountUnavailable />
        )}
      </PageRoot>
    </>
  )
}

export { DeleteAccountPage }
