import { useCallback, useEffect, useRef, useState } from 'react'
import { buildPresignFiles, buildSubmitPayload, getReportApiUrl } from '../features/safety/report/report.helpers'
import type { PresignResponse, ReportFormState } from '../features/safety/report/report.types'
import { fetchWithIdentity } from '../utils/signedFetch'
import type { UseSubmitReportOptions, UseSubmitReportResult } from './useSubmitReport.types'

const JSON_HEADERS = { ['Content-Type']: 'application/json' }

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function useSubmitReport({ identity }: UseSubmitReportOptions): UseSubmitReportResult {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const submitReport = useCallback(
    async (formState: ReportFormState): Promise<boolean> => {
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller
      const { signal } = controller

      setIsSubmitting(true)
      setError(null)

      try {
        if (!identity) {
          throw new Error('Missing identity')
        }

        const reportApiUrl = getReportApiUrl()

        const presignBody = JSON.stringify({ files: buildPresignFiles(formState.evidence) })
        const presignResponse = await fetchWithIdentity(
          `${reportApiUrl}/api/reports/players/presign`,
          identity,
          'POST',
          presignBody,
          JSON_HEADERS,
          signal
        )

        if (!presignResponse.ok) {
          throw new Error(`Presign failed (${presignResponse.status})`)
        }

        const presignData = (await presignResponse.json()) as PresignResponse

        if (presignData.files.length !== formState.evidence.length) {
          throw new Error(`Presign file count mismatch (got ${presignData.files.length}, expected ${formState.evidence.length})`)
        }

        await Promise.all(
          presignData.files.map((presignedFile, index) => {
            const evidence = formState.evidence[index]
            return fetch(presignedFile.uploadUrl, {
              method: 'PUT',
              headers: { ['Content-Type']: evidence.file.type },
              body: evidence.file,
              signal
            }).then(uploadResponse => {
              if (!uploadResponse.ok) {
                throw new Error(`Upload failed (${uploadResponse.status})`)
              }
            })
          })
        )

        const finalizeBody = JSON.stringify(
          buildSubmitPayload(
            presignData.reportId,
            presignData.files.map(f => f.key),
            formState
          )
        )
        const finalizeResponse = await fetchWithIdentity(
          `${reportApiUrl}/api/reports/players`,
          identity,
          'POST',
          finalizeBody,
          JSON_HEADERS,
          signal
        )

        if (!finalizeResponse.ok) {
          throw new Error(`Finalize failed (${finalizeResponse.status})`)
        }

        return true
      } catch (caught) {
        if (isAbortError(caught)) {
          return false
        }
        console.error('[useSubmitReport]', caught)
        setError('submit_failed')
        return false
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null
        }
        setIsSubmitting(false)
      }
    },
    [identity]
  )

  return { submitReport, isSubmitting, error }
}

export { useSubmitReport }
