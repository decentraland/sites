import { useCallback, useEffect, useState } from 'react'
import { getStorageErrorKey } from '../features/storage'

interface UseDialogErrorResult {
  errorKey: string | null
  clearError: () => void
  setErrorFrom: (error: unknown) => void
}

/**
 * Holds the inline `errorKey` state shown by the storage Save dialogs.
 *
 * Replaces the `useState<string|null>` + `useEffect` reset + `getStorageErrorKey`
 * call repeated across EnvAddDialog/EnvEditDialog/SceneAddDialog/SceneEditDialog/
 * PlayerAddDialog/PlayerEditDialog. Pass any state that should clear the error
 * (`open`, `keyName`, …) as `resetWhen` — the hook re-renders with `errorKey:
 * null` whenever any of those entries change.
 */
function useDialogError(resetWhen: ReadonlyArray<unknown>): UseDialogErrorResult {
  const [errorKey, setErrorKey] = useState<string | null>(null)

  useEffect(() => {
    setErrorKey(null)
  }, resetWhen)

  const clearError = useCallback(() => setErrorKey(null), [])
  const setErrorFrom = useCallback((error: unknown) => setErrorKey(getStorageErrorKey(error)), [])

  return { errorKey, clearError, setErrorFrom }
}

export { useDialogError }
export type { UseDialogErrorResult }
