import { useCallback, useState } from 'react'
import { useTranslation } from '@dcl/hooks'
import { useDeleteEventMutation } from '../features/events'
import { useAuthIdentity } from './useAuthIdentity'

type DeleteTarget = {
  id: string
  name: string
}

type DeleteFeedback = {
  title?: string
  message: string
  severity: 'success' | 'error'
}

type UseDeleteHangoutOptions = {
  // Called after a successful delete so the caller can close any open detail modal and refresh.
  onDeleted?: () => void
}

type UseDeleteHangoutResult = {
  // Opens the confirmation modal for the given hangout.
  requestDelete: (target: DeleteTarget) => void
  // True while the confirmation modal is open.
  isConfirmOpen: boolean
  // True while the DELETE request is in flight.
  isDeleting: boolean
  // Dismisses the confirmation modal (no-op while a delete is in flight).
  closeConfirm: () => void
  // Fires the DELETE request for the pending target.
  confirmDelete: () => Promise<void>
  // Snackbar feedback after the request resolves; null when there's nothing to show.
  feedback: DeleteFeedback | null
  // Clears the snackbar feedback.
  clearFeedback: () => void
}

function useDeleteHangout(options: UseDeleteHangoutOptions = {}): UseDeleteHangoutResult {
  const { onDeleted } = options
  const { t } = useTranslation()
  const { identity } = useAuthIdentity()
  const [deleteEvent, { isLoading: isDeleting }] = useDeleteEventMutation()
  const [target, setTarget] = useState<DeleteTarget | null>(null)
  const [feedback, setFeedback] = useState<DeleteFeedback | null>(null)

  const requestDelete = useCallback((next: DeleteTarget) => {
    setTarget(next)
  }, [])

  const closeConfirm = useCallback(() => {
    if (isDeleting) return
    setTarget(null)
  }, [isDeleting])

  const clearFeedback = useCallback(() => {
    setFeedback(null)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!target || !identity) {
      console.error('[useDeleteHangout] confirmDelete called without identity or target')
      return
    }
    try {
      await deleteEvent({ eventId: target.id, identity }).unwrap()
      setFeedback({
        title: t('event_detail.delete_modal.toast_title'),
        message: t('event_detail.delete_modal.toast_description', { name: target.name }),
        severity: 'success'
      })
      setTarget(null)
      onDeleted?.()
    } catch (error) {
      // Surface a generic message — never propagate the raw server error body to the UI (rule 10).
      console.error('[useDeleteHangout] delete failed', error)
      setFeedback({ message: t('event_detail.delete_modal.error'), severity: 'error' })
    }
  }, [deleteEvent, identity, onDeleted, t, target])

  return {
    requestDelete,
    isConfirmOpen: target !== null,
    isDeleting,
    closeConfirm,
    confirmDelete,
    feedback,
    clearFeedback
  }
}

export { useDeleteHangout }
