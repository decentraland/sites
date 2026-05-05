import { useCallback, useState } from 'react'
import type { AuthIdentity } from '@dcl/crypto'
import { fetchWithIdentity } from '../../utils/signedFetch'
import { buildPresignFiles, buildSubmitPayload, getReportApiUrl } from './report.helpers'
import type { PresignResponse, ReportFormState } from './report.types'

const JSON_HEADERS = { ['Content-Type']: 'application/json' }

interface UseSubmitReportResult {
  submitReport: (formState: ReportFormState) => Promise<boolean>
  isSubmitting: boolean
  error: string | null
}

interface UseSubmitReportOptions {
  identity: AuthIdentity | undefined
}

function useSubmitReport({ identity }: UseSubmitReportOptions): UseSubmitReportResult {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitReport = useCallback(
    async (formState: ReportFormState): Promise<boolean> => {
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
          JSON_HEADERS
        )

        if (!presignResponse.ok) {
          throw new Error(`Presign failed (${presignResponse.status})`)
        }

        const presignData = (await presignResponse.json()) as PresignResponse

        await Promise.all(
          presignData.files.map((presignedFile, index) => {
            const evidence = formState.evidence[index]
            return fetch(presignedFile.uploadUrl, {
              method: 'PUT',
              headers: { ['Content-Type']: evidence.file.type },
              body: evidence.file
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
          JSON_HEADERS
        )

        if (!finalizeResponse.ok) {
          throw new Error(`Finalize failed (${finalizeResponse.status})`)
        }

        return true
      } catch (caught) {
        console.error('[useSubmitReport]', caught)
        setError('submit_failed')
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [identity]
  )

  return { submitReport, isSubmitting, error }
}

export { useSubmitReport }
export type { UseSubmitReportOptions, UseSubmitReportResult }
