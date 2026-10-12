import { useCallback, useEffect, useRef, useState } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { fetchExportFile, getStorageErrorKey, getStorageErrorStatus, useCreateExportMutation, useGetExportQuery } from '../features/storage'
import type { ExportFormat, ExportSelection } from '../features/storage'
import { triggerBlobDownload } from '../modules/file'
import { SegmentEvent } from '../modules/segment.types'
import { gunzipBlob } from '../utils/gunzipBlob'
import { useAuthIdentity } from './useAuthIdentity'
import { useStorageScope } from './useStorageScope'
import { useStorageTrack } from './useStorageTrack'

interface UseStorageExportResult {
  startExport: (selection: ExportSelection, format: ExportFormat) => void
  busy: boolean
  errorKey: string | null
  clearError: () => void
}

interface PendingJob {
  id: string
  format: ExportFormat
  request: number
}

const EXPORT_FAILED_KEY = 'component.storage.errors.export_failed'
const POLL_INTERVAL_MS = 1000

/** Runs a storage export job: creates it, polls until it settles, then unzips and saves the file. */
function useStorageExport(): UseStorageExportResult {
  const { identity } = useAuthIdentity()
  const { realm, position } = useStorageScope()
  const track = useStorageTrack()
  const [createExport, { isLoading: isCreating }] = useCreateExportMutation()
  const [job, setJob] = useState<PendingJob | null>(null)
  const [saving, setSaving] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const requestRef = useRef(0)
  const handledRef = useRef(0)
  const mountedRef = useRef(true)
  const busy = job !== null || saving || isCreating

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const { currentData } = useGetExportQuery(job ? { identity, realm, position, id: job.id } : skipToken, {
    pollingInterval: POLL_INTERVAL_MS,
    refetchOnMountOrArgChange: true
  })

  const failWith = useCallback(
    (format: ExportFormat, error: unknown) => {
      setErrorKey(getStorageErrorKey(error))
      track(SegmentEvent.STORAGE_EXPORT_FAILURE, { format, errorStatus: getStorageErrorStatus(error) ?? 'unknown' })
    },
    [track]
  )

  const save = useCallback(
    async ({ id, format }: PendingJob) => {
      setSaving(true)
      try {
        const file = await gunzipBlob(await fetchExportFile({ identity, realm, position, id }))
        if (!mountedRef.current) return
        triggerBlobDownload(file, `storage-export.${format}`)
        track(SegmentEvent.STORAGE_EXPORT_SUCCESS, { format })
      } catch (error) {
        if (mountedRef.current) failWith(format, error)
      } finally {
        if (mountedRef.current) setSaving(false)
      }
    },
    [identity, realm, position, track, failWith]
  )

  useEffect(() => {
    if (!job || currentData?.id !== job.id) return
    if (currentData.status !== 'done' && currentData.status !== 'failed') return
    if (handledRef.current === job.request) return
    handledRef.current = job.request
    setJob(null)
    if (currentData.status === 'done') {
      void save(job)
      return
    }
    setErrorKey(EXPORT_FAILED_KEY)
    track(SegmentEvent.STORAGE_EXPORT_FAILURE, { format: job.format })
  }, [currentData, job, save, track])

  const startExport = useCallback(
    (selection: ExportSelection, format: ExportFormat) => {
      if (busy || !identity) return
      setErrorKey(null)
      createExport({ identity, realm, position, format, selection })
        .unwrap()
        .then(({ id }) => setJob({ id, format, request: ++requestRef.current }))
        .catch(error => failWith(format, error))
    },
    [busy, identity, realm, position, createExport, failWith]
  )

  const clearError = useCallback(() => setErrorKey(null), [])

  return { startExport, busy, errorKey, clearError }
}

export { useStorageExport }
