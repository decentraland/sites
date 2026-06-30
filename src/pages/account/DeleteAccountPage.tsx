import { useCallback, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { DeleteAccountConfirmModal } from '../../components/account/DeleteAccount/DeleteAccountConfirmModal/DeleteAccountConfirmModal'
import { DeleteAccountSection } from '../../components/account/DeleteAccount/DeleteAccountSection/DeleteAccountSection'
import { DeleteAccountUnavailable } from '../../components/account/DeleteAccount/DeleteAccountUnavailable/DeleteAccountUnavailable'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useIsThirdwebAccount } from '../../hooks/useIsThirdwebAccount'
import { PageRoot } from './DeleteAccountPage.styled'

const DeleteAccountPage = () => {
  const t = useFormatMessage()
  const navigate = useNavigate()
  const { address } = useAuthIdentity()
  // Deletion only applies to thirdweb in-app (email / social-OTP) wallets; self-custodial logins have
  // no account to delete client-side, so they see an explanatory message instead of the danger zone.
  const isThirdweb = useIsThirdwebAccount()
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
        {isThirdweb ? (
          <>
            <DeleteAccountSection address={address} onOpenConfirmModal={handleOpenConfirmModal} onGoToWallets={handleGoToWallets} />
            <DeleteAccountConfirmModal open={isConfirmOpen} address={address} onClose={handleCloseConfirmModal} />
          </>
        ) : (
          <DeleteAccountUnavailable />
        )}
      </PageRoot>
    </>
  )
}

export { DeleteAccountPage }
