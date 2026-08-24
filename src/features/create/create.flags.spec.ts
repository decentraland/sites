import { act, renderHook, waitFor } from '@testing-library/react'
import { resetCreateFlagsForTests, useWemotesBuilderEnabled } from './create.flags'

const flagsResponse = (flags: Record<string, boolean>) =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ flags })
  } as Response)

describe('when resolving the wemotes-builder release flag', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    resetCreateFlagsForTests()
    fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the remote flag is enabled', () => {
    beforeEach(() => {
      fetchMock.mockReturnValue(flagsResponse({ 'dapps-wemotes-builder': true }))
    })

    it('should start disabled and enable once the flag loads', async () => {
      const { result } = renderHook(() => useWemotesBuilderEnabled())

      expect(result.current).toBe(false)
      await waitFor(() => {
        expect(result.current).toBe(true)
      })
    })

    it('should fetch the flags file only once across consumers', async () => {
      const first = renderHook(() => useWemotesBuilderEnabled())
      renderHook(() => useWemotesBuilderEnabled())

      await waitFor(() => {
        expect(first.result.current).toBe(true)
      })
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('and the remote flag is disabled, missing, or the fetch fails', () => {
    it.each([
      ['disabled', () => fetchMock.mockReturnValue(flagsResponse({ 'dapps-wemotes-builder': false }))],
      ['missing', () => fetchMock.mockReturnValue(flagsResponse({}))],
      ['failing', () => fetchMock.mockRejectedValue(new Error('network down'))]
    ])('should stay disabled when the flag fetch is %s', async (_label, arrange) => {
      arrange()

      const { result } = renderHook(() => useWemotesBuilderEnabled())

      await act(async () => {
        await Promise.resolve()
      })
      expect(result.current).toBe(false)
    })
  })
})
