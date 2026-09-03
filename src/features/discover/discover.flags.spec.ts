import { renderHook, waitFor } from '@testing-library/react'
import {
  DEFAULT_LIVE_MIN_USERS,
  resetDiscoverFlagsForTests,
  useHideFeaturedPlaces,
  useLiveMinUsers,
  useRepeatAcrossSections
} from './discover.flags'

type Variant = { name: string; payload: { type: string; value: string }; enabled: boolean }

const flagsResponse = (flags: Record<string, boolean>, variants: Record<string, Variant> = {}) =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ flags, variants })
  } as Response)

const minUsersVariant = (value: string): Variant => ({ name: 'min_users', payload: { type: 'string', value }, enabled: true })

let fetchMock: jest.Mock

beforeEach(() => {
  resetDiscoverFlagsForTests()
  fetchMock = jest.fn()
  global.fetch = fetchMock as unknown as typeof fetch
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('when resolving the repeat-across-sections flag', () => {
  it('should start off and turn on once the flag loads', async () => {
    fetchMock.mockReturnValue(flagsResponse({ 'dapps-places-repeat-cross-sections': true }))

    const { result } = renderHook(() => useRepeatAcrossSections())

    expect(result.current).toBe(false)
    await waitFor(() => expect(result.current).toBe(true))
  })

  it('should stay off when the flag is disabled', async () => {
    fetchMock.mockReturnValue(flagsResponse({ 'dapps-places-repeat-cross-sections': false }))

    const { result } = renderHook(() => useRepeatAcrossSections())
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    expect(result.current).toBe(false)
  })

  it('should stay off rather than inherit another flag when the entry is missing', async () => {
    fetchMock.mockReturnValue(flagsResponse({ 'dapps-places-hide-featured-section': true }))

    const { result } = renderHook(() => useRepeatAcrossSections())
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    expect(result.current).toBe(false)
  })

  it('should stay off without parsing the body when the service responds non-ok', async () => {
    const json = jest.fn()
    fetchMock.mockReturnValue(Promise.resolve({ ok: false, status: 503, json } as unknown as Response))
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    const { result } = renderHook(() => useRepeatAcrossSections())
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    expect(result.current).toBe(false)
    expect(json).not.toHaveBeenCalled()
  })

  it('should stay off when the fetch fails', async () => {
    fetchMock.mockReturnValue(Promise.reject(new Error('offline')))
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    const { result } = renderHook(() => useRepeatAcrossSections())
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    expect(result.current).toBe(false)
  })
})

describe('when resolving the LIVE minimum from its flag variant', () => {
  it('should read the number the variant carries once the flag loads', async () => {
    fetchMock.mockReturnValue(flagsResponse({ 'dapps-places-live-min-user': true }, { 'dapps-places-live-min-user': minUsersVariant('5') }))

    const { result } = renderHook(() => useLiveMinUsers())

    expect(result.current).toBe(DEFAULT_LIVE_MIN_USERS)
    await waitFor(() => expect(result.current).toBe(5))
  })

  it('should fall back to the default when the flag is on but the host gets no variant', async () => {
    // What zone serves today: the flag without its payload.
    fetchMock.mockReturnValue(flagsResponse({ 'dapps-places-live-min-user': true }))

    const { result } = renderHook(() => useLiveMinUsers())
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    expect(result.current).toBe(DEFAULT_LIVE_MIN_USERS)
  })

  it('should ignore the variant while the flag itself is off', async () => {
    fetchMock.mockReturnValue(
      flagsResponse({ 'dapps-places-live-min-user': false }, { 'dapps-places-live-min-user': minUsersVariant('5') })
    )

    const { result } = renderHook(() => useLiveMinUsers())
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    expect(result.current).toBe(DEFAULT_LIVE_MIN_USERS)
  })

  it.each(['0', '-3', 'five', '', '2.5', '1e3', '5px'])('should fall back to the default for an unusable payload (%p)', async value => {
    fetchMock.mockReturnValue(
      flagsResponse({ 'dapps-places-live-min-user': true }, { 'dapps-places-live-min-user': minUsersVariant(value) })
    )

    const { result } = renderHook(() => useLiveMinUsers())
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    expect(result.current).toBe(DEFAULT_LIVE_MIN_USERS)
  })

  it.each([' 5', '5\n', ' 5 '])('should tolerate whitespace around the number (%p)', async value => {
    // The live file already ships payloads with a trailing newline.
    fetchMock.mockReturnValue(
      flagsResponse({ 'dapps-places-live-min-user': true }, { 'dapps-places-live-min-user': minUsersVariant(value) })
    )

    const { result } = renderHook(() => useLiveMinUsers())
    await waitFor(() => expect(result.current).toBe(5))
  })

  it('should fall back to the default when the variant carries no value', async () => {
    fetchMock.mockReturnValue(
      flagsResponse(
        { 'dapps-places-live-min-user': true },
        { 'dapps-places-live-min-user': { name: 'min_users', payload: {} as Variant['payload'], enabled: true } }
      )
    )

    const { result } = renderHook(() => useLiveMinUsers())
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    expect(result.current).toBe(DEFAULT_LIVE_MIN_USERS)
  })

  it('should fall back to the default when the flags file is missing', async () => {
    fetchMock.mockReturnValue(Promise.reject(new Error('offline')))
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    const { result } = renderHook(() => useLiveMinUsers())
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    expect(result.current).toBe(DEFAULT_LIVE_MIN_USERS)
  })
})

describe('when resolving the hide-Featured flag', () => {
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

  it('should read independently of the other two flags', async () => {
    fetchMock.mockReturnValue(
      flagsResponse(
        { 'dapps-places-hide-featured-section': true, 'dapps-places-repeat-cross-sections': false, 'dapps-places-live-min-user': true },
        { 'dapps-places-live-min-user': minUsersVariant('3') }
      )
    )

    const hide = renderHook(() => useHideFeaturedPlaces())
    const repeat = renderHook(() => useRepeatAcrossSections())
    const min = renderHook(() => useLiveMinUsers())

    await waitFor(() => expect(hide.result.current).toBe(true))
    expect(repeat.result.current).toBe(false)
    expect(min.result.current).toBe(3)
  })
})
