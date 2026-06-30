import { useCallback, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { CircularProgress } from 'decentraland-ui2'
import { DeleteAccountConfirmModal } from '../../components/account/DeleteAccount/DeleteAccountConfirmModal/DeleteAccountConfirmModal'
import { DeleteAccountSection } from '../../components/account/DeleteAccount/DeleteAccountSection/DeleteAccountSection'
import { DeleteAccountUnavailable } from '../../components/account/DeleteAccount/DeleteAccountUnavailable/DeleteAccountUnavailable'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useCanDeleteAccount } from '../../hooks/useCanDeleteAccount'
import { LoadingState, PageRoot } from './DeleteAccountPage.styled'

const DeleteAccountPage = () => {
  const t = useFormatMessage()
  const navigate = useNavigate()
  const { address } = useAuthIdentity()
  // Deletion applies to web2 logins (thirdweb via the SDK, Magic via the auth-server); self-custodial
  // logins (MetaMask / WalletConnect) have no account to delete. While provider detection resolves we
  // show a loader rather than briefly flashing the "unavailable" message at a Magic user.
  const { canDelete, isMagic, isResolvingProvider } = useCanDeleteAccount()
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
        ) : isResolvingProvider ? (
          <LoadingState data-role="delete-account-loading">
            <CircularProgress />
          </LoadingState>
        ) : (
          <DeleteAccountUnavailable />
        )}
      </PageRoot>
    </>
  )
}

export { DeleteAccountPage }
