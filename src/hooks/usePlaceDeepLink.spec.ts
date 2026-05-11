import { skipToken } from '@reduxjs/toolkit/query/react'
import { act, renderHook } from '@testing-library/react'
import { usePlaceDeepLink } from './usePlaceDeepLink'

const mockSetSearchParams = jest.fn()
const mockUseSearchParams = jest.fn()
const mockUseGetJumpPlacesQuery = jest.fn()

jest.mock('react-router-dom', () => ({
  useSearchParams: () => mockUseSearchParams()
}))

jest.mock('../features/places', () => {
  const ENS_REGEX = /^[a-zA-Z0-9.]+\.eth$/
  return {
    useGetJumpPlacesQuery: (...args: unknown[]) => mockUseGetJumpPlacesQuery(...args),
    isEns: (value: string | undefined) => !!value?.match(ENS_REGEX)?.length,
    parsePosition: (value: string) => {
      const tokens = value.split(/[,.]/g)
      if (tokens.length !== 2) return { original: value, coordinates: [0, 0], isValid: false }
      const x = Number.parseInt(tokens[0], 10)
      const y = Number.parseInt(tokens[1], 10)
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return { original: value, coordinates: [0, 0], isValid: false }
      }
      return { original: value, coordinates: [x, y], isValid: true }
    }
  }
})

const mockNormalizeJumpPlace = jest.fn()

jest.mock('../components/whats-on/PlaceDetailModal', () => ({
  normalizeJumpPlace: (...args: unknown[]) => mockNormalizeJumpPlace(...args)
}))

describe('usePlaceDeepLink', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when no place query params are present', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams(''), mockSetSearchParams])
      mockUseGetJumpPlacesQuery.mockReturnValue({ data: undefined })
    })

    it('should pass skipToken to useGetJumpPlacesQuery so the request never fires', () => {
      renderHook(() => usePlaceDeepLink())

      expect(mockUseGetJumpPlacesQuery).toHaveBeenCalledWith(skipToken)
    })

    it('should expose isOpen=false and modalData=null', () => {
      const { result } = renderHook(() => usePlaceDeepLink())

      expect(result.current.isOpen).toBe(false)
      expect(result.current.modalData).toBeNull()
    })
  })

  describe('when a position query param is present', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams('position=10,20'), mockSetSearchParams])
    })

    describe('and the place has been fetched successfully', () => {
      beforeEach(() => {
        mockUseGetJumpPlacesQuery.mockReturnValue({ data: [{ id: 'place-1' }] })
        mockNormalizeJumpPlace.mockReturnValue({ id: 'place-1', title: 'Genesis Plaza' })
      })

      it('should request the place by parsed coordinates', () => {
        renderHook(() => usePlaceDeepLink())

        expect(mockUseGetJumpPlacesQuery).toHaveBeenCalledWith({ position: [10, 20] })
      })

      it('should expose isOpen=true and the normalized place data', () => {
        const { result } = renderHook(() => usePlaceDeepLink())

        expect(result.current.isOpen).toBe(true)
        expect(result.current.modalData?.id).toBe('place-1')
      })

      describe('and closeDeepLink is called', () => {
        it('should drop both place params from the URL via replace navigation', () => {
          mockUseSearchParams.mockReturnValue([new URLSearchParams('position=10,20&world=foo.dcl.eth&env=dev'), mockSetSearchParams])
          const { result } = renderHook(() => usePlaceDeepLink())

          act(() => {
            result.current.closeDeepLink()
          })

          expect(mockSetSearchParams).toHaveBeenCalledTimes(1)
          const [updater, options] = mockSetSearchParams.mock.calls[0]
          const next = updater(new URLSearchParams('position=10,20&world=foo.dcl.eth&env=dev'))
          expect(next.get('position')).toBeNull()
          expect(next.get('world')).toBeNull()
          expect(next.get('env')).toBe('dev')
          expect(options).toEqual({ replace: true })
        })
      })
    })

    describe('and the position is malformed', () => {
      beforeEach(() => {
        mockUseSearchParams.mockReturnValue([new URLSearchParams('position=not-a-coord'), mockSetSearchParams])
        mockUseGetJumpPlacesQuery.mockReturnValue({ data: undefined })
      })

      it('should pass skipToken so the request never fires', () => {
        renderHook(() => usePlaceDeepLink())

        expect(mockUseGetJumpPlacesQuery).toHaveBeenCalledWith(skipToken)
      })
    })

    describe('and the request fails with a 404', () => {
      beforeEach(() => {
        mockUseGetJumpPlacesQuery.mockReturnValue({ data: undefined, error: { status: 404, data: null } })
      })

      it('should strip the place params from the URL so the broken deep link does not persist on reload', () => {
        renderHook(() => usePlaceDeepLink())

        expect(mockSetSearchParams).toHaveBeenCalledTimes(1)
        const [, options] = mockSetSearchParams.mock.calls[0]
        expect(options).toEqual({ replace: true })
      })
    })

    describe('and the request fails transiently (5xx or network error)', () => {
      it('should keep the params in the URL so a transient API blip does not destroy the deep link', () => {
        mockUseGetJumpPlacesQuery.mockReturnValue({ data: undefined, error: { status: 503, data: null } })

        renderHook(() => usePlaceDeepLink())

        expect(mockSetSearchParams).not.toHaveBeenCalled()
      })
    })
  })

  describe('when a world query param is present with a valid ENS', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams('world=towerofmadness.dcl.eth'), mockSetSearchParams])
      mockUseGetJumpPlacesQuery.mockReturnValue({ data: [{ id: 'world-1' }] })
      mockNormalizeJumpPlace.mockReturnValue({ id: 'world-1', title: 'Tower of Madness' })
    })

    it('should request the world via realm arg', () => {
      renderHook(() => usePlaceDeepLink())

      expect(mockUseGetJumpPlacesQuery).toHaveBeenCalledWith({ realm: 'towerofmadness.dcl.eth' })
    })

    it('should take precedence over a position param when both are present', () => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams('world=towerofmadness.dcl.eth&position=10,20'), mockSetSearchParams])

      renderHook(() => usePlaceDeepLink())

      expect(mockUseGetJumpPlacesQuery).toHaveBeenCalledWith({ realm: 'towerofmadness.dcl.eth' })
    })
  })

  describe('when a world query param is a bare name', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams('world=brai'), mockSetSearchParams])
      mockUseGetJumpPlacesQuery.mockReturnValue({ data: [{ id: 'world-1' }] })
      mockNormalizeJumpPlace.mockReturnValue({ id: 'world-1', title: 'Brai World' })
    })

    it('should expand the bare name to a .dcl.eth ENS so legacy share links resolve', () => {
      renderHook(() => usePlaceDeepLink())

      expect(mockUseGetJumpPlacesQuery).toHaveBeenCalledWith({ realm: 'brai.dcl.eth' })
    })
  })

  describe('when a world query param has mixed casing', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams('world=Brai.DCL.eth'), mockSetSearchParams])
      mockUseGetJumpPlacesQuery.mockReturnValue({ data: [{ id: 'world-1' }] })
      mockNormalizeJumpPlace.mockReturnValue({ id: 'world-1', title: 'Brai World' })
    })

    it('should normalize to lowercase so two casings hit the same RTK Query cache entry', () => {
      renderHook(() => usePlaceDeepLink())

      expect(mockUseGetJumpPlacesQuery).toHaveBeenCalledWith({ realm: 'brai.dcl.eth' })
    })
  })

  describe('when a world query param is not a valid bare name', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams('world=not%20a%20name%21'), mockSetSearchParams])
      mockUseGetJumpPlacesQuery.mockReturnValue({ data: undefined })
    })

    it('should not fire the request', () => {
      renderHook(() => usePlaceDeepLink())

      expect(mockUseGetJumpPlacesQuery).toHaveBeenCalledWith(skipToken)
    })
  })
})
