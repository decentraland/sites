export interface DeleteAccountConfirmModalProps {
  open: boolean
  /** The thirdweb in-app wallet address whose account will be deleted. */
  address?: string
  onClose: () => void
}
