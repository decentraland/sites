export interface DeleteAccountSectionProps {
  address?: string
  /**
   * Whether the connected account is a Magic login. Magic users back up their private key from the
   * Security tab (reveal.magic.link), so the export-key affordance points there instead of Wallets.
   */
  isMagic?: boolean
  onOpenConfirmModal: () => void
  onGoToWallets: () => void
  /** Navigate to the Security tab. Only invoked for Magic logins (see `isMagic`). */
  onGoToSecurity?: () => void
}
