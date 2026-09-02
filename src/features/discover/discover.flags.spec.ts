import { renderHook, waitFor } from '@testing-library/react'
import { resetDiscoverFlagsForTests, useHideFeaturedPlaces, useNewPlacesLayout } from './discover.flags'

const flagsResponse = (flags: Record<string, boolean>) =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ flags })
  } as Response)

describe('when resolving the new Places layout flag', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    resetDiscoverFlagsForTests()
    fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the remote flag is enabled', () => {
    beforeEach(() => {
      fetchMock.mockReturnValue(flagsResponse({ 'dapps-places-repeat-cross-sections': true }))
    })

    it('should start off and turn on once the flag loads', async () => {
      const { result } = renderHook(() => useNewPlacesLayout())

      expect(result.current).toBe(false)
      await waitFor(() => {
        expect(result.current).toBe(true)
      })
    })
  })

  describe('and the remote flag is disabled', () => {
    beforeEach(() => {
      fetchMock.mockReturnValue(flagsResponse({ 'dapps-places-repeat-cross-sections': false }))
    })

    it('should stay off', async () => {
      const { result } = renderHook(() => useNewPlacesLayout())

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled()
      })
      expect(result.current).toBe(false)
    })
  })

  describe('and the flags file is missing the flag entirely', () => {
    beforeEach(() => {
      fetchMock.mockReturnValue(flagsResponse({ 'dapps-invite-direct-download': true }))
    })

    it('should stay off rather than inherit another flag', async () => {
      const { result } = renderHook(() => useNewPlacesLayout())

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled()
      })
      expect(result.current).toBe(false)
    })
  })

  describe('and the flags file responds with a non-ok status', () => {
    let json: jest.Mock

    beforeEach(() => {
      json = jest.fn()
      fetchMock.mockResolvedValue({ ok: false, status: 500, json } as unknown as Response)
      jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    })

    it('should stay off without parsing the body', async () => {
      const { result } = renderHook(() => useNewPlacesLayout())

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled()
      })
      expect(result.current).toBe(false)
      expect(json).not.toHaveBeenCalled()
    })
  })

  describe('and the fetch fails', () => {
    beforeEach(() => {
      fetchMock.mockRejectedValue(new Error('offline'))
      jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    })

    it('should stay off so the page keeps the behaviour production ships', async () => {
      const { result } = renderHook(() => useNewPlacesLayout())

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled()
      })
      expect(result.current).toBe(false)
    })
  })
})

describe('when resolving the hide-Featured flag', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    resetDiscoverFlagsForTests()
    fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should turn on once the remote flag loads', async () => {
    fetchMock.mockReturnValue(flagsResponse({ 'dapps-places-hide-featured-section': true }))

    const { result } = renderHook(() => useHideFeaturedPlaces())

    expect(result.current).toBe(false)
    await waitFor(() => expect(result.current).toBe(true))
  })

  it('should stay off when the flag is absent, so the section survives', async () => {
    fetchMock.mockReturnValue(flagsResponse({ 'dapps-places-repeat-cross-sections': true }))

    const { result } = renderHook(() => useHideFeaturedPlaces())
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    expect(result.current).toBe(false)
  })

  it('should read independently of the layout flag', async () => {
    fetchMock.mockReturnValue(flagsResponse({ 'dapps-places-hide-featured-section': true, 'dapps-places-repeat-cross-sections': false }))

    const hide = renderHook(() => useHideFeaturedPlaces())
    const layout = renderHook(() => useNewPlacesLayout())

    await waitFor(() => expect(hide.result.current).toBe(true))
    expect(layout.result.current).toBe(false)
  })
})
