import { renderHook, waitFor } from '@testing-library/react'
import { resetFeatureFlagsForTests } from '../../modules/featureFlagStore'
import { useEventFeaturedItemSearch } from './events.flags'

const flagsResponse = (flags: Record<string, boolean>) =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ flags })
  } as Response)

describe('when resolving the event featured-item search flag', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    resetFeatureFlagsForTests()
    fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  describe('and the remote flag is enabled', () => {
    it('should enable the search picker once the flag loads', async () => {
      fetchMock.mockReturnValue(flagsResponse({ 'dapps-event-featured-item-search': true }))

      const { result } = renderHook(() => useEventFeaturedItemSearch())
      expect(result.current).toBe(false)

      await waitFor(() => expect(result.current).toBe(true))
    })
  })

  describe('and the remote flag is missing', () => {
    it('should keep the plain urn input', async () => {
      fetchMock.mockReturnValue(flagsResponse({ 'some-other-flag': true }))

      const { result } = renderHook(() => useEventFeaturedItemSearch())

      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      expect(result.current).toBe(false)
    })
  })

  describe('and the flags fetch fails', () => {
    it('should keep the plain urn input', async () => {
      fetchMock.mockRejectedValue(new Error('offline'))

      const { result } = renderHook(() => useEventFeaturedItemSearch())

      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      expect(result.current).toBe(false)
    })
  })
})
