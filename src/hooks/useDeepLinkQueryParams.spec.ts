import { useSearchParams } from 'react-router-dom'
import { act, renderHook } from '@testing-library/react'
import { useDeepLinkQueryParams } from './useDeepLinkQueryParams'

jest.mock('react-router-dom', () => ({ useSearchParams: jest.fn() }))

const mockedSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>

const withSearch = (search: string) => {
  mockedSearchParams.mockReturnValue([new URLSearchParams(search), jest.fn()])
  return renderHook(() => useDeepLinkQueryParams()).result.current
}

describe('useDeepLinkQueryParams', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the url carries no deep-link params', () => {
    it('should leave every param undefined', () => {
      expect(withSearch('')).toEqual({ dclenv: undefined, sceneConsole: undefined, multiInstance: undefined })
    })
  })

  describe('when ?dclenv names a known environment', () => {
    it.each(['zone', 'today', 'org'])('should use "%s" as-is', value => {
      expect(withSearch(`dclenv=${value}`).dclenv).toBe(value)
    })
  })

  describe('when ?dclenv names anything else', () => {
    // The value ends up in the `decentraland://` deep link and ui2 forwards it
    // without validating, so an arbitrary one would redirect which Explorer
    // environment opens, on any route that carries the navbar.
    it.each(['bogus', 'prod', 'https://evil.test'])('should drop "%s"', value => {
      expect(withSearch(`dclenv=${value}`).dclenv).toBeUndefined()
    })
  })

  describe('when only ?env is present', () => {
    it('should map it to the matching dclenv', () => {
      expect(withSearch('env=dev').dclenv).toBe('zone')
    })

    it('should leave dclenv undefined for an unknown value', () => {
      expect(withSearch('env=nope').dclenv).toBeUndefined()
    })
  })

  describe('when both ?dclenv and ?env are present', () => {
    it('should prefer ?dclenv', () => {
      expect(withSearch('dclenv=today&env=dev').dclenv).toBe('today')
    })

    it('should fall back to ?env when ?dclenv is valueless', () => {
      expect(withSearch('dclenv=&env=dev').dclenv).toBe('zone')
    })

    it('should fall back to ?env when ?dclenv is unknown', () => {
      expect(withSearch('dclenv=bogus&env=stg').dclenv).toBe('today')
    })
  })

  describe('when ?scene-console is true', () => {
    it('should forward the literal true that ui2 expects', () => {
      expect(withSearch('scene-console=true').sceneConsole).toBe('true')
    })
  })

  describe('when ?scene-console holds anything other than true', () => {
    it.each(['scene-console=false', 'scene-console=1', 'scene-console='])('should drop it for "?%s"', search => {
      expect(withSearch(search).sceneConsole).toBeUndefined()
    })
  })

  describe('when ?multi-instance is true', () => {
    it('should forward the literal true that ui2 expects', () => {
      expect(withSearch('multi-instance=true').multiInstance).toBe('true')
    })
  })

  describe('when ?multi-instance holds anything other than true', () => {
    // `launchDesktopApp` presence-checks the value, so forwarding these verbatim
    // would switch multi-instance ON for a caller that asked for it to be off.
    it.each(['multi-instance=false', 'multi-instance=0', 'multi-instance=1', 'multi-instance='])('should drop it for "?%s"', search => {
      expect(withSearch(search).multiInstance).toBeUndefined()
    })
  })

  describe('when the search params change after mount', () => {
    // The hook returns an unmemoized object on purpose and callers list the
    // individual primitives in their `useCallback` deps, so the values have to
    // track the URL across a re-render.
    it('should surface the new values', () => {
      mockedSearchParams.mockReturnValue([new URLSearchParams(''), jest.fn()])
      const { result, rerender } = renderHook(() => useDeepLinkQueryParams())

      expect(result.current.multiInstance).toBeUndefined()

      mockedSearchParams.mockReturnValue([new URLSearchParams('multi-instance=true&dclenv=zone'), jest.fn()])
      act(() => rerender())

      expect(result.current).toEqual({ dclenv: 'zone', sceneConsole: undefined, multiInstance: 'true' })
    })
  })
})
