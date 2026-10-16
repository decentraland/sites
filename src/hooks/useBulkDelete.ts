import { useCallback, useRef, useState } from 'react'
import { deleteSelection } from '../features/storage'
import type { Selection } from './useSelection'

interface BulkDeleteOutcome {
  allSelected: boolean
  ok: boolean
  count: number
}

interface UseBulkDeleteParams {
  selection: Selection
  deleteOne: (id: string) => Promise<unknown>
  clearAll: () => Promise<unknown>
  onResult: (outcome: BulkDeleteOutcome) => void
}

interface UseBulkDeleteResult {
  open: boolean
  pending: boolean
  errorKey: string | null
  request: () => void
  confirm: () => Promise<void>
  cancel: () => void
  clearError: () => void
}

const BULK_DELETE_FAILED_KEY = 'component.storage.errors.bulk_delete_failed'

/** Guarded bulk-delete flow for a storage page: clears on full success, keeps failed rows selected with an error otherwise. */
function useBulkDelete(params: UseBulkDeleteParams): UseBulkDeleteResult {
  const { selection, deleteOne, clearAll, onResult } = params
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const pendingRef = useRef(false)

  const request = useCallback(() => setOpen(true), [])

  const cancel = useCallback(() => {
    if (!pendingRef.current) setOpen(false)
  }, [])

  const clearError = useCallback(() => setErrorKey(null), [])

  const confirm = useCallback(async () => {
    if (pendingRef.current) return
    const { allSelected, selected, clear } = selection
    const ids = [...selected]
    const count = ids.length
    pendingRef.current = true
    setPending(true)
    setErrorKey(null)
    try {
      const failedIds = await deleteSelection({ allSelected, ids, deleteOne, clearAll })
      const ok = failedIds.length === 0
      onResult({ allSelected, ok, count })
      if (ok) {
        clear()
      } else {
        setErrorKey(BULK_DELETE_FAILED_KEY)
      }
    } finally {
      pendingRef.current = false
      setPending(false)
      setOpen(false)
    }
  }, [selection, deleteOne, clearAll, onResult])

  return { open, pending, errorKey, request, confirm, cancel, clearError }
}

export { useBulkDelete }
export type { BulkDeleteOutcome }
