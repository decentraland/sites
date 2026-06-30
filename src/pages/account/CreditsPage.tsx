import { useCallback, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { mapJoinErrorToI18nKey, mapOptOutErrorToI18nKey } from '../../components/account/Credits/credits.errors'
import { CreditsStatusCard } from '../../components/account/Credits/CreditsStatusCard/CreditsStatusCard'
import { OptOutConfirmModal } from '../../components/account/Credits/OptOutConfirmModal/OptOutConfirmModal'
import { useGetUserCreditsStatusQuery, useOptOutFromCreditsMutation, useRegisterForCreditsMutation } from '../../features/account-credits'
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
  const [register, { isLoading: isJoining }] = useRegisterForCreditsMutation()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [joinErrorKey, setJoinErrorKey] = useState<string | null>(null)

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

  // Join enrolls the wallet in-place via the credits-server (POST /users), instead of bouncing to
  // the Marketplace. The optimistic cache patch flips the card to "Enrolled" immediately.
  const handleJoin = useCallback(async () => {
    if (!address) return
    setJoinErrorKey(null)
    try {
      await register(address).unwrap()
    } catch (error) {
      setJoinErrorKey(mapJoinErrorToI18nKey(error as Parameters<typeof mapJoinErrorToI18nKey>[0]))
    }
  }, [address, register])

  return (
    <>
      <Helmet>
        <title>{`${t('account.pages.credits.title')} | Decentraland`}</title>
      </Helmet>
      <CreditsPanel data-role="credits-panel">
        <CreditsStatusCard
          status={data?.status}
          isLoading={isLoading}
          isJoining={isJoining}
          joinErrorKey={joinErrorKey}
          onJoin={handleJoin}
          onLeave={handleOpenModal}
        />
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
