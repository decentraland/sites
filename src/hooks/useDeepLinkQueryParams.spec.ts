import { useSearchParams } from 'react-router-dom'
import { renderHook } from '@testing-library/react'
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

  describe('when ?dclenv is present', () => {
    it('should use it verbatim', () => {
      expect(withSearch('dclenv=zone').dclenv).toBe('zone')
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
  })

  describe('when ?scene-console is present', () => {
    it('should forward it verbatim', () => {
      expect(withSearch('scene-console=true').sceneConsole).toBe('true')
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
})
