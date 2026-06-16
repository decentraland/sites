import { useCallback, useRef, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
// eslint-disable-next-line @typescript-eslint/naming-convention
import WarningRoundedIcon from '@mui/icons-material/WarningRounded'
import { getProfiles, unlinkProfile } from 'thirdweb/wallets/in-app'
import { localStorageClearIdentity } from '@dcl/single-sign-on-client'
import { getEnv } from '../../../../config/env'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { useWalletAddress } from '../../../../hooks/useWalletAddress'
import { thirdwebClient } from '../../../../lib/thirdweb'
import { DeleteAccountConfirmModalProps } from './DeleteAccountConfirmModal.types'
import {
  ButtonContainer,
  CancelButton,
  CloseIconButton,
  ConfirmDeleteButton,
  ConfirmationInput,
  ErrorMessage,
  ModalDescription,
  StyledDialog,
  StyledDialogContent,
  WarningIconCircle,
  WarningIconContainer,
  WarningTitle
} from './DeleteAccountConfirmModal.styled'

// The confirmation word must remain the literal "DELETE" across all locales.
// Do not translate this value — the locale strings reference it verbatim and the
// user is required to type it exactly to enable the destructive action.
const CONFIRMATION_WORD = 'DELETE'

// NOTE: This flow only applies to thirdweb in-app (email / social-OTP) wallets.
// Deletion unlinks every thirdweb auth profile client-side; there is no
// server-side endpoint to delegate to, which is why the `thirdweb` SDK is pulled
// into sites despite the repo's "no Web3 providers" rule (see lib/thirdweb.ts).

/**
 * Deletes the user's thirdweb in-app wallet account by unlinking all profiles.
 * The last profile is unlinked with `allowAccountDeletion` set to true, which
 * triggers thirdweb's backend account deletion.
 *
 * @throws If no profiles are linked or if any unlinkProfile call fails.
 */
async function deleteThirdwebAccount() {
  // Fetch all authentication profiles linked to the in-app wallet.
  const profiles = await getProfiles({ client: thirdwebClient })

  if (profiles.length === 0) {
    throw new Error('No profiles linked to this account')
  }

  // Unlink each profile; allowAccountDeletion on the last one deletes the account.
  for (let i = 0; i < profiles.length; i++) {
    const isLast = i === profiles.length - 1
    await unlinkProfile({
      client: thirdwebClient,
      profileToUnlink: profiles[i],
      allowAccountDeletion: isLast
    })
  }
}

/**
 * Clears all local session data: SSO identity, thirdweb storage (local + session
 * + IndexedDB), and the sites wallet pointer via `disconnect()`. Runs regardless
 * of whether the redirect succeeds, so no stale session persists after deletion.
 *
 * Note: thirdweb's `unlinkProfile()` only hits the server-side API and does NOT
 * clean up local storage. Since this modal is not rendered inside a
 * ThirdwebProvider, we clear thirdweb's local data manually.
 */
async function clearLocalSession(address: string, disconnect: () => void) {
  // Clear the Decentraland SSO identity for the connected address.
  localStorageClearIdentity(address)

  // Clear thirdweb session data from localStorage (auth cookies, device shares, wallet user id).
  Object.keys(localStorage)
    .filter(key => key.startsWith('thirdweb'))
    .forEach(key => localStorage.removeItem(key))

  // Clear thirdweb session data from sessionStorage.
  Object.keys(sessionStorage)
    .filter(key => key.startsWith('thirdweb'))
    .forEach(key => sessionStorage.removeItem(key))

  // Clear thirdweb IndexedDB databases (device shares, wallet encryption keys).
  // indexedDB.deleteDatabase() returns an IDBOpenDBRequest, not a Promise, so we
  // wrap each call to await completion before redirecting.
  if (typeof indexedDB !== 'undefined' && typeof indexedDB.databases === 'function') {
    try {
      const databases = await indexedDB.databases()
      await Promise.all(
        databases
          .filter(db => db.name?.includes('thirdweb'))
          .map(
            db =>
              new Promise<void>((resolve, reject) => {
                if (!db.name) return resolve()
                const request = indexedDB.deleteDatabase(db.name)
                request.onsuccess = () => resolve()
                request.onerror = () => reject(request.error)
              })
          )
      )
    } catch {
      // Best-effort: not all browsers support indexedDB.databases().
    }
  }

  // Drop the sites wallet pointer + SSO/connect keys (replaces decentraland-connect's
  // connection.disconnect() — sites has no decentraland-connect).
  disconnect()
}

const DeleteAccountConfirmModal = ({ open, address, onClose }: DeleteAccountConfirmModalProps) => {
  const t = useFormatMessage()
  const { disconnect } = useWalletAddress()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationText, setConfirmationText] = useState('')
  const isDeleting = useRef(false)

  const isConfirmed = confirmationText === CONFIRMATION_WORD

  const handleDeleteAccount = useCallback(async () => {
    if (!address || !isConfirmed || isDeleting.current) return

    isDeleting.current = true
    setIsLoading(true)
    setError(null)

    try {
      await deleteThirdwebAccount()
    } catch (deletionError) {
      // Log the raw error; surface only a generic message to the user.
      console.error('Account deletion failed:', deletionError)
      setError(t('account.delete.modal.generic_error'))
      setIsLoading(false)
      isDeleting.current = false
      return
    }

    // Past the point of no return: always clear local session and redirect,
    // even if individual cleanup steps fail.
    try {
      await clearLocalSession(address, disconnect)
    } catch (cleanupError) {
      console.error('Local session cleanup failed:', cleanupError)
    }

    // Redirect to the login page; a full page reload destroys all in-memory state.
    const authUrl = getEnv('AUTH_URL') ?? ''
    window.location.replace(`${authUrl}/login?redirectTo=${encodeURIComponent(window.location.pathname)}`)
  }, [address, disconnect, isConfirmed, t])

  // Prevent dismissal via ESC or backdrop click while deletion is in flight.
  const canDismiss = !isLoading

  const handleClose = useCallback(() => {
    if (!canDismiss) return
    setConfirmationText('')
    setError(null)
    onClose()
  }, [canDismiss, onClose])

  return (
    <StyledDialog open={open} onClose={handleClose} fullWidth data-role="delete-account-confirm-modal">
      <CloseIconButton onClick={handleClose} disabled={!canDismiss} aria-label="Close" data-role="delete-account-confirm-close">
        <CloseIcon />
      </CloseIconButton>
      <StyledDialogContent>
        <WarningIconContainer>
          <WarningIconCircle>
            <WarningRoundedIcon sx={{ fontSize: 40, color: '#FCFCFC' }} />
          </WarningIconCircle>
        </WarningIconContainer>
        <WarningTitle>{t('account.delete.modal.title')}</WarningTitle>
        <ModalDescription>{t('account.delete.modal.description')}</ModalDescription>

        {error && <ErrorMessage data-role="delete-account-confirm-error">{error}</ErrorMessage>}

        <ConfirmationInput
          label={t('account.delete.modal.input_label')}
          value={confirmationText}
          onChange={event => setConfirmationText(event.target.value)}
          placeholder={CONFIRMATION_WORD}
          disabled={isLoading}
          autoComplete="off"
          variant="outlined"
          // eslint-disable-next-line @typescript-eslint/naming-convention
          inputProps={{ 'data-role': 'delete-account-confirm-input' }}
        />

        <ButtonContainer>
          <CancelButton variant="contained" color="secondary" onClick={handleClose} disabled={!canDismiss}>
            {t('account.delete.modal.cancel')}
          </CancelButton>
          <ConfirmDeleteButton
            variant="contained"
            onClick={handleDeleteAccount}
            disabled={!isConfirmed || isLoading}
            data-role="delete-account-confirm-submit"
          >
            {isLoading ? t('account.delete.modal.deleting') : t('account.delete.modal.delete')}
          </ConfirmDeleteButton>
        </ButtonContainer>
      </StyledDialogContent>
    </StyledDialog>
  )
}

export { DeleteAccountConfirmModal }
