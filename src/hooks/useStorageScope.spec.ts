import { MemoryRouter, useSearchParams } from 'react-router-dom'
import { renderHook } from '@testing-library/react'
import { useStorageScope } from './useStorageScope'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: jest.fn()
}))

const mockedUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>

describe('useStorageScope', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when no params are present', () => {
    it('should return null realm and null position', () => {
      mockedUseSearchParams.mockReturnValue([new URLSearchParams(''), jest.fn()])
      const { result } = renderHook(() => useStorageScope(), { wrapper: MemoryRouter })
      expect(result.current).toEqual({ realm: null, position: null })
    })
  })

  describe('when realm and position are present', () => {
    it('should return both values', () => {
      mockedUseSearchParams.mockReturnValue([new URLSearchParams('realm=foo&position=10,20'), jest.fn()])
      const { result } = renderHook(() => useStorageScope(), { wrapper: MemoryRouter })
      expect(result.current).toEqual({ realm: 'foo', position: '10,20' })
    })
  })
})
