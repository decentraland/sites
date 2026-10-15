import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { fetchExportFile, getStorageErrorKey, getStorageErrorStatus } from '../features/storage'
import type { ExportFormat, ExportSelection } from '../features/storage'
import { triggerBlobDownload } from '../modules/file'
import { SegmentEvent } from '../modules/segment.types'
import { useAuthIdentity } from './useAuthIdentity'
import { useStorageScope } from './useStorageScope'
import { useStorageTrack } from './useStorageTrack'

interface UseStorageExportResult {
  startExport: (selection: ExportSelection, format: ExportFormat) => void
  busy: boolean
  errorKey: string | null
  clearError: () => void
}

interface ExportState {
  busy: boolean
  errorKey: string | null
}

const EXPORT_FAILED_KEY = 'component.storage.errors.export_failed'

const IDLE: ExportState = { busy: false, errorKey: null }

let state: ExportState = IDLE
let controller: AbortController | null = null
const listeners = new Set<() => void>()

const emit = (): void => listeners.forEach(listener => listener())
const setState = (next: ExportState): void => {
  state = next
  emit()
}
const getState = (): ExportState => state

const abortActive = (): void => {
  if (!controller) return
  controller.abort()
  controller = null
  setState({ busy: false, errorKey: state.errorKey })
}

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      controller?.abort()
      controller = null
      state = IDLE
    }
  }
}

/** One shared export controller for the whole storage area: a second start while one streams does nothing, and there is a single busy/error source. */
function useStorageExport(): UseStorageExportResult {
  const { identity } = useAuthIdentity()
  const { realm, position } = useStorageScope()
  const track = useStorageTrack()
  const snapshot = useSyncExternalStore(subscribe, getState, getState)

  useEffect(() => () => abortActive(), [realm, position, identity])

  const runExport = useCallback(
    async (selection: ExportSelection, format: ExportFormat) => {
      const activeController = new AbortController()
      controller = activeController
      setState({ busy: true, errorKey: null })
      try {
        const file = await fetchExportFile({ identity, realm, position, format, selection, signal: activeController.signal })
        if (activeController.signal.aborted) return
        triggerBlobDownload(file, `storage-export.${format}`)
        track(SegmentEvent.STORAGE_EXPORT_SUCCESS, { format })
        controller = null
        setState(IDLE)
      } catch (error) {
        if (activeController.signal.aborted) return
        const status = getStorageErrorStatus(error)
        controller = null
        setState({ busy: false, errorKey: status === 'FETCH_ERROR' ? EXPORT_FAILED_KEY : getStorageErrorKey(error) })
        track(SegmentEvent.STORAGE_EXPORT_FAILURE, { format, errorStatus: status ?? 'unknown' })
      }
    },
    [identity, realm, position, track]
  )

  const startExport = useCallback(
    (selection: ExportSelection, format: ExportFormat) => {
      if (controller || !identity) return
      void runExport(selection, format)
    },
    [identity, runExport]
  )

  const clearError = useCallback(() => setState({ busy: state.busy, errorKey: null }), [])

  return { startExport, busy: snapshot.busy, errorKey: snapshot.errorKey, clearError }
}

export { useStorageExport }
