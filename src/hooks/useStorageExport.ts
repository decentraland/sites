import { useCallback, useEffect, useRef, useState } from 'react'
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

const EXPORT_FAILED_KEY = 'component.storage.errors.export_failed'

/** Streams a storage export for the selection and saves it, aborting it when the caller unmounts. */
function useStorageExport(): UseStorageExportResult {
  const { identity } = useAuthIdentity()
  const { realm, position } = useStorageScope()
  const track = useStorageTrack()
  const [busy, setBusy] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const runExport = useCallback(
    async (selection: ExportSelection, format: ExportFormat) => {
      const controller = new AbortController()
      controllerRef.current = controller
      setBusy(true)
      setErrorKey(null)
      try {
        const file = await fetchExportFile({ identity, realm, position, format, selection, signal: controller.signal })
        if (controller.signal.aborted) return
        triggerBlobDownload(file, `storage-export.${format}`)
        track(SegmentEvent.STORAGE_EXPORT_SUCCESS, { format })
      } catch (error) {
        if (controller.signal.aborted) return
        const status = getStorageErrorStatus(error)
        setErrorKey(status === 'FETCH_ERROR' ? EXPORT_FAILED_KEY : getStorageErrorKey(error))
        track(SegmentEvent.STORAGE_EXPORT_FAILURE, { format, errorStatus: status ?? 'unknown' })
      } finally {
        if (!controller.signal.aborted) {
          controllerRef.current = null
          setBusy(false)
        }
      }
    },
    [identity, realm, position, track]
  )

  const startExport = useCallback(
    (selection: ExportSelection, format: ExportFormat) => {
      if (controllerRef.current || !identity) return
      void runExport(selection, format)
    },
    [identity, runExport]
  )

  const clearError = useCallback(() => setErrorKey(null), [])

  return { startExport, busy, errorKey, clearError }
}

export { useStorageExport }
