import { act, renderHook } from '@testing-library/react'
import type { AuthIdentity } from '@dcl/crypto'
import { fetchWithIdentity } from '../../utils/signedFetch'
import { useSubmitReport } from './useSubmitReport'
import { ReportReason } from './report.types'
import type { ReportFormState, UploadedFile } from './report.types'

jest.mock('../../config/env', () => ({
  getEnv: () => 'https://report-user.example.com'
}))

jest.mock('../../utils/signedFetch', () => ({
  fetchWithIdentity: jest.fn()
}))

const fetchWithIdentityMock = fetchWithIdentity as jest.MockedFunction<typeof fetchWithIdentity>

const fakeIdentity = { authChain: [] } as unknown as AuthIdentity

function buildEvidence(): UploadedFile {
  const file = new File(['hello'], 'screenshot.png', { type: 'image/png' })
  return { id: 'evidence-1', file, name: 'screenshot.png', size: 5 }
}

function buildFormState(): ReportFormState {
  return {
    playerAddress: '0x1111111111111111111111111111111111111111',
    reportedAddress: '0x2222222222222222222222222222222222222222',
    reason: ReportReason.HARASSMENT,
    description: 'They griefed me on the plaza',
    evidence: [buildEvidence()],
    additionalComments: '',
    confirmAccuracy: true
  }
}

const presignResponseBody = {
  reportId: 'report-123',
  files: [
    { uploadUrl: 'https://s3.example.com/upload', key: 'reports/report-123/screenshot.png', publicUrl: 'https://s3.example.com/public' }
  ]
}

function okJsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response
}

function okEmptyResponse(): Response {
  return { ok: true, status: 204, json: async () => ({}) } as unknown as Response
}

function failingResponse(status: number): Response {
  return { ok: false, status, json: async () => ({}) } as unknown as Response
}

describe('useSubmitReport', () => {
  let fetchMock: jest.SpyInstance

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(okEmptyResponse())
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when identity is undefined', () => {
    it('should fail with submit_failed and not call any network', async () => {
      const { result } = renderHook(() => useSubmitReport({ identity: undefined }))

      let outcome = true
      await act(async () => {
        outcome = await result.current.submitReport(buildFormState())
      })

      expect(outcome).toBe(false)
      expect(result.current.error).toBe('submit_failed')
      expect(fetchWithIdentityMock).not.toHaveBeenCalled()
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  describe('when the happy path runs', () => {
    beforeEach(() => {
      fetchWithIdentityMock.mockResolvedValueOnce(okJsonResponse(presignResponseBody)).mockResolvedValueOnce(okEmptyResponse())
    })

    it('should call presign, upload each file to S3, then finalize, and return true', async () => {
      const { result } = renderHook(() => useSubmitReport({ identity: fakeIdentity }))

      let outcome = false
      await act(async () => {
        outcome = await result.current.submitReport(buildFormState())
      })

      expect(outcome).toBe(true)
      expect(result.current.error).toBeNull()
      expect(fetchWithIdentityMock).toHaveBeenNthCalledWith(
        1,
        'https://report-user.example.com/api/reports/players/presign',
        fakeIdentity,
        'POST',
        expect.any(String),
        { 'Content-Type': 'application/json' }
      )
      expect(fetchMock).toHaveBeenCalledWith('https://s3.example.com/upload', expect.objectContaining({ method: 'PUT' }))
      expect(fetchWithIdentityMock).toHaveBeenNthCalledWith(
        2,
        'https://report-user.example.com/api/reports/players',
        fakeIdentity,
        'POST',
        expect.stringContaining('"evidenceKeys":["reports/report-123/screenshot.png"]'),
        { 'Content-Type': 'application/json' }
      )
    })
  })

  describe('when presign fails', () => {
    beforeEach(() => {
      fetchWithIdentityMock.mockResolvedValueOnce(failingResponse(500))
    })

    it('should not upload or finalize, and surface a generic error', async () => {
      const { result } = renderHook(() => useSubmitReport({ identity: fakeIdentity }))

      let outcome = true
      await act(async () => {
        outcome = await result.current.submitReport(buildFormState())
      })

      expect(outcome).toBe(false)
      expect(result.current.error).toBe('submit_failed')
      expect(fetchMock).not.toHaveBeenCalled()
      expect(fetchWithIdentityMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('when an S3 upload fails', () => {
    beforeEach(() => {
      fetchWithIdentityMock.mockResolvedValueOnce(okJsonResponse(presignResponseBody))
      fetchMock.mockResolvedValueOnce(failingResponse(403))
    })

    it('should not finalize and surface a generic error', async () => {
      const { result } = renderHook(() => useSubmitReport({ identity: fakeIdentity }))

      let outcome = true
      await act(async () => {
        outcome = await result.current.submitReport(buildFormState())
      })

      expect(outcome).toBe(false)
      expect(result.current.error).toBe('submit_failed')
      expect(fetchWithIdentityMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the finalize call fails', () => {
    beforeEach(() => {
      fetchWithIdentityMock.mockResolvedValueOnce(okJsonResponse(presignResponseBody)).mockResolvedValueOnce(failingResponse(502))
    })

    it('should surface a generic error and return false', async () => {
      const { result } = renderHook(() => useSubmitReport({ identity: fakeIdentity }))

      let outcome = true
      await act(async () => {
        outcome = await result.current.submitReport(buildFormState())
      })

      expect(outcome).toBe(false)
      expect(result.current.error).toBe('submit_failed')
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchWithIdentityMock).toHaveBeenCalledTimes(2)
    })
  })
})
