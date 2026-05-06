import { useCallback, useEffect, useRef, useState } from 'react'
import { buildPresignFiles, buildSubmitPayload, getReportApiUrl, sanitizeFilename } from '../features/report/report.helpers'
import type { PresignResponse, ReportFormState, UploadedFile } from '../features/report/report.types'
import { fetchWithIdentity } from '../utils/signedFetch'
import type { UseSubmitReportOptions, UseSubmitReportResult } from './useSubmitReport.types'

const JSON_HEADERS = { ['Content-Type']: 'application/json' }

function basename(path: string): string {
  return path.split('/').pop() ?? ''
}

function buildEvidenceLookup(evidence: UploadedFile[]): Map<string, UploadedFile> {
  const lookup = new Map<string, UploadedFile>()
  evidence.forEach(item => {
    lookup.set(sanitizeFilename(item.name), item)
  })
  return lookup
}

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
        const evidenceLookup = buildEvidenceLookup(formState.evidence)

        await Promise.all(
          presignData.files.map(presignedFile => {
            const evidence = evidenceLookup.get(basename(presignedFile.key))
            if (!evidence) {
              throw new Error(`Unmatched presign file: ${presignedFile.key}`)
            }
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
