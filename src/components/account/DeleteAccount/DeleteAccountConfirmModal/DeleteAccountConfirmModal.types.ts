export interface DeleteAccountConfirmModalProps {
  open: boolean
  /** The wallet address whose account will be deleted. */
  address?: string
  /** Whether the connected account is a Magic login (deleted via the auth-server) instead of thirdweb. */
  isMagic?: boolean
  onClose: () => void
}
