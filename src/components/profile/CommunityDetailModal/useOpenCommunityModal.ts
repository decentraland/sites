import { useCallback, useState } from 'react'
import { useModalCommunityNavigation } from '../ProfileModal/ModalProfileNavigation'

interface UseOpenCommunityModalResult {
  openCommunityId: string | null
  open: (communityId: string) => void
  close: () => void
}

function useOpenCommunityModal(): UseOpenCommunityModalResult {
  const delegate = useModalCommunityNavigation()
  const [openCommunityId, setOpenCommunityId] = useState<string | null>(null)

  const open = useCallback(
    (communityId: string) => {
      if (!communityId) return
      if (delegate) {
        delegate(communityId)
        return
      }
      setOpenCommunityId(communityId)
    },
    [delegate]
  )

  const close = useCallback(() => setOpenCommunityId(null), [])

  return { openCommunityId, open, close }
}

export { useOpenCommunityModal }
