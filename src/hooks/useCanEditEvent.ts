import { useAdminPermissions } from './useAdminPermissions'
import { useWalletAddress } from './useWalletAddress'

function useCanEditEvent(creatorAddress: string | null | undefined): boolean {
  const { address } = useWalletAddress()
  const { canEditAnyEvent } = useAdminPermissions()

  if (canEditAnyEvent) return true
  if (!address || !creatorAddress) return false
  return address.toLowerCase() === creatorAddress.toLowerCase()
}

export { useCanEditEvent }
