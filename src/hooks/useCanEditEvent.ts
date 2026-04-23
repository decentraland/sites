import { useAdminPermissions } from './useAdminPermissions'
import { useWalletAddress } from './useWalletAddress'

type UseCanEditEventResult = {
  canEdit: boolean
  isLoading: boolean
}

function useCanEditEvent(creatorAddress: string | null | undefined): UseCanEditEventResult {
  const { address } = useWalletAddress()
  const { canEditAnyEvent, isLoading } = useAdminPermissions()

  if (isLoading) return { canEdit: false, isLoading: true }
  if (canEditAnyEvent) return { canEdit: true, isLoading: false }
  if (!address || !creatorAddress) return { canEdit: false, isLoading: false }
  return { canEdit: address.toLowerCase() === creatorAddress.toLowerCase(), isLoading: false }
}

export { useCanEditEvent }
export type { UseCanEditEventResult }
