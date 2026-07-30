import { act, renderHook, waitFor } from '@testing-library/react'
import { isDirectDownloadEnabled } from '../../utils/referrer'
import { resetInviteFlagsForTests, useInviteDirectDownload } from './invite.flags'

jest.mock('../../utils/referrer', () => ({
  isDirectDownloadEnabled: jest.fn()
}))

const flagsResponse = (flags: Record<string, boolean>) =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ flags })
  } as Response)

describe('when resolving the invite direct-download flag', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    resetInviteFlagsForTests()
    ;(isDirectDownloadEnabled as jest.Mock).mockReturnValue(true)
    fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the remote flag is enabled', () => {
    beforeEach(() => {
      fetchMock.mockReturnValue(flagsResponse({ 'dapps-invite-direct-download': true }))
    })

    it('should start disabled and enable once the flag loads', async () => {
      const { result } = renderHook(() => useInviteDirectDownload())

      expect(result.current).toBe(false)
      await waitFor(() => {
        expect(result.current).toBe(true)
      })
    })

    it('should fetch the flags file only once across consumers', async () => {
      const first = renderHook(() => useInviteDirectDownload())
      renderHook(() => useInviteDirectDownload())

      await waitFor(() => {
        expect(first.result.current).toBe(true)
      })
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('and the remote flag is disabled or missing', () => {
    it.each([
      ['disabled', { 'dapps-invite-direct-download': false }],
      ['missing', {}]
    ])('should stay disabled when the flag is %s', async (_label, flags) => {
      fetchMock.mockReturnValue(flagsResponse(flags))

      const { result } = renderHook(() => useInviteDirectDownload())

      await act(async () => {
        await Promise.resolve()
      })
      expect(result.current).toBe(false)
    })
  })

  describe('and the flags fetch fails', () => {
    it('should stay disabled', async () => {
      fetchMock.mockRejectedValue(new Error('network down'))

      const { result } = renderHook(() => useInviteDirectDownload())

      await act(async () => {
        await Promise.resolve()
      })
      expect(result.current).toBe(false)
    })
  })

  describe('and the environment gate is off', () => {
    it('should stay disabled even when the remote flag is enabled', async () => {
      ;(isDirectDownloadEnabled as jest.Mock).mockReturnValue(false)
      fetchMock.mockReturnValue(flagsResponse({ 'dapps-invite-direct-download': true }))

      const { result } = renderHook(() => useInviteDirectDownload())

      await act(async () => {
        await Promise.resolve()
      })
      expect(result.current).toBe(false)
    })
  })
})
