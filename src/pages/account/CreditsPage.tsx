import { useCallback, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { mapOptOutErrorToI18nKey } from '../../components/account/Credits/credits.errors'
import { openCreditsSignup } from '../../components/account/Credits/credits.helpers'
import { CreditsStatusCard } from '../../components/account/Credits/CreditsStatusCard/CreditsStatusCard'
import { OptOutConfirmModal } from '../../components/account/Credits/OptOutConfirmModal/OptOutConfirmModal'
import { useGetUserCreditsStatusQuery, useOptOutFromCreditsMutation } from '../../features/account-credits'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { CreditsPanel } from './CreditsPage.styled'

const CreditsPage = () => {
  const t = useFormatMessage()
  const { address } = useAuthIdentity()

  // AccountLayout gates the whole section behind a localStorage identity, so `address` is present
  // by the time this page renders; `skipToken` only guards the brief unauthenticated window.
  const { data, isLoading } = useGetUserCreditsStatusQuery(address ?? '', { skip: !address })
  const [optOut, { isLoading: isLeaving }] = useOptOutFromCreditsMutation()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const handleOpenModal = useCallback(() => {
    setErrorKey(null)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setErrorKey(null)
  }, [])

  const handleConfirmLeave = useCallback(async () => {
    if (!address) return
    setErrorKey(null)
    try {
      await optOut(address).unwrap()
      setIsModalOpen(false)
    } catch (error) {
      // Never surface the raw server body (Pre-PR rule 10) — map to a known i18n key.
      setErrorKey(mapOptOutErrorToI18nKey(error as Parameters<typeof mapOptOutErrorToI18nKey>[0]))
    }
  }, [address, optOut])

  return (
    <>
      <Helmet>
        <title>{`${t('account.pages.credits.title')} | Decentraland`}</title>
      </Helmet>
      <CreditsPanel data-role="credits-panel">
        <CreditsStatusCard status={data?.status} isLoading={isLoading} onJoin={openCreditsSignup} onLeave={handleOpenModal} />
      </CreditsPanel>
      <OptOutConfirmModal
        open={isModalOpen}
        isLeaving={isLeaving}
        errorKey={errorKey}
        onConfirm={handleConfirmLeave}
        onClose={handleCloseModal}
      />
    </>
  )
}

export { CreditsPage }
