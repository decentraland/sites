import { useCallback, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { DeleteAccountConfirmModal } from '../../components/account/DeleteAccount/DeleteAccountConfirmModal/DeleteAccountConfirmModal'
import { DeleteAccountSection } from '../../components/account/DeleteAccount/DeleteAccountSection/DeleteAccountSection'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { PageRoot, PageTitle } from './DeleteAccountPage.styled'

const DeleteAccountPage = () => {
  const t = useFormatMessage()
  const navigate = useNavigate()
  const { address } = useAuthIdentity()
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
        <PageTitle variant="h4">{t('account.pages.delete.title')}</PageTitle>
        <DeleteAccountSection address={address} onOpenConfirmModal={handleOpenConfirmModal} onGoToWallets={handleGoToWallets} />
        <DeleteAccountConfirmModal open={isConfirmOpen} address={address} onClose={handleCloseConfirmModal} />
      </PageRoot>
    </>
  )
}

export { DeleteAccountPage }
