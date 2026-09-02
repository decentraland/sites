import { act, renderHook, waitFor } from '@testing-library/react'
import { resetFeatureFlagsForTests, useRemoteFeatureFlag } from './featureFlagStore'
import { FEATURE_FLAG } from './ff'
import { SEGMENT_KILL_SWITCH_KEY } from './segmentKillSwitch'

const flagsResponse = (flags: Record<string, boolean>) =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ flags })
  } as Response)

describe('useRemoteFeatureFlag', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    resetFeatureFlagsForTests()
    fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  describe('when the requested flag is enabled remotely', () => {
    it('should start disabled and flip on once the file loads', async () => {
      fetchMock.mockReturnValue(flagsResponse({ 'some-flag': true }))

      const { result } = renderHook(() => useRemoteFeatureFlag('some-flag'))
      expect(result.current).toBe(false)

      await waitFor(() => expect(result.current).toBe(true))
    })
  })

  describe('when the requested flag is disabled or absent', () => {
    it('should stay disabled for an explicit false', async () => {
      fetchMock.mockReturnValue(flagsResponse({ 'some-flag': false }))

      const { result } = renderHook(() => useRemoteFeatureFlag('some-flag'))

      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      expect(result.current).toBe(false)
    })

    it('should stay disabled when the flag is missing entirely', async () => {
      fetchMock.mockReturnValue(flagsResponse({ 'another-flag': true }))

      const { result } = renderHook(() => useRemoteFeatureFlag('some-flag'))

      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      expect(result.current).toBe(false)
    })
  })

  describe('when several flags are read on the same page', () => {
    it('should fetch the file only once and answer each one independently', async () => {
      fetchMock.mockReturnValue(flagsResponse({ 'flag-a': true, 'flag-b': false }))

      const a = renderHook(() => useRemoteFeatureFlag('flag-a'))
      const b = renderHook(() => useRemoteFeatureFlag('flag-b'))

      await waitFor(() => expect(a.result.current).toBe(true))
      expect(b.result.current).toBe(false)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the fetch fails', () => {
    it('should leave every flag off', async () => {
      fetchMock.mockRejectedValue(new Error('network down'))

      const { result } = renderHook(() => useRemoteFeatureFlag('some-flag'))

      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      expect(result.current).toBe(false)
    })
  })

  describe('when the service answers with an error status', () => {
    it('should leave every flag off', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 503 } as Response)

      const { result } = renderHook(() => useRemoteFeatureFlag('some-flag'))

      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      expect(result.current).toBe(false)
    })
  })

  describe('when the payload has no flags object', () => {
    it('should leave every flag off', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) } as Response)

      const { result } = renderHook(() => useRemoteFeatureFlag('some-flag'))

      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      expect(result.current).toBe(false)
    })
  })

  describe('when the last consumer unmounts', () => {
    it('should stop notifying it', async () => {
      fetchMock.mockReturnValue(flagsResponse({ 'some-flag': true }))

      const { result, unmount } = renderHook(() => useRemoteFeatureFlag('some-flag'))
      await waitFor(() => expect(result.current).toBe(true))

      act(() => unmount())

      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })

  // The Segment proxy kill switch cannot be read as a flag at boot (analytics starts first), so
  // this fetch is what persists it for the next page load. See `segmentKillSwitch.ts`.
  describe('when the file carries the Segment proxy kill switch', () => {
    it('should persist it as on when it is enabled', async () => {
      fetchMock.mockReturnValue(flagsResponse({ [FEATURE_FLAG.segmentKillSwitch]: true }))

      renderHook(() => useRemoteFeatureFlag('some-flag'))

      await waitFor(() => expect(localStorage.getItem(SEGMENT_KILL_SWITCH_KEY)).toBe('1'))
    })

    it('should persist it as off when it is absent, the service only publishes enabled flags', async () => {
      fetchMock.mockReturnValue(flagsResponse({ 'some-flag': true }))

      renderHook(() => useRemoteFeatureFlag('some-flag'))

      await waitFor(() => expect(localStorage.getItem(SEGMENT_KILL_SWITCH_KEY)).toBe('0'))
    })

    it('should leave the last known value alone when the fetch fails', async () => {
      localStorage.setItem(SEGMENT_KILL_SWITCH_KEY, '1')
      fetchMock.mockRejectedValue(new Error('network down'))

      renderHook(() => useRemoteFeatureFlag('some-flag'))

      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      expect(localStorage.getItem(SEGMENT_KILL_SWITCH_KEY)).toBe('1')
    })
  })
})
