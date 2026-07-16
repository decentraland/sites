import { MemoryRouter, useSearchParams } from 'react-router-dom'
import { renderHook } from '@testing-library/react'
import { useGetWorldScenesQuery } from '../features/storage'
import { useStorageScope } from './useStorageScope'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: jest.fn()
}))

jest.mock('../features/storage', () => ({
  useGetWorldScenesQuery: jest.fn()
}))

const mockedUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>
const mockedUseGetWorldScenes = useGetWorldScenesQuery as jest.Mock

const setParams = (search: string) => mockedUseSearchParams.mockReturnValue([new URLSearchParams(search), jest.fn()])
const setScenes = (value: { data?: unknown; isError?: boolean }) => mockedUseGetWorldScenes.mockReturnValue(value)
const render = () => renderHook(() => useStorageScope(), { wrapper: MemoryRouter }).result

describe('useStorageScope', () => {
  beforeEach(() => {
    setScenes({ data: undefined, isError: false })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when no params are present', () => {
    it('should return null realm and null position without resolving', () => {
      setParams('')
      expect(render().current).toEqual({ realm: null, position: null, isResolving: false, unresolved: false })
    })
  })

  describe('when a non-world realm and position are present', () => {
    it('should return both values and skip scene resolution', () => {
      setParams('realm=foo&position=10,20')
      expect(render().current).toEqual({ realm: 'foo', position: '10,20', isResolving: false, unresolved: false })
      expect(mockedUseGetWorldScenes).toHaveBeenCalledWith({ worldName: 'foo' }, { skip: true })
    })
  })

  describe('when a world realm has an explicit position', () => {
    it('should keep the URL position authoritative and skip resolution', () => {
      setParams('realm=world.dcl.eth&position=5,5')
      expect(render().current).toEqual({ realm: 'world.dcl.eth', position: '5,5', isResolving: false, unresolved: false })
      expect(mockedUseGetWorldScenes).toHaveBeenCalledWith({ worldName: 'world.dcl.eth' }, { skip: true })
    })
  })

  describe('when a world realm has no position and scenes are loading', () => {
    it('should report isResolving with a null position', () => {
      setParams('realm=world.dcl.eth')
      setScenes({ data: undefined, isError: false })
      expect(render().current).toEqual({ realm: 'world.dcl.eth', position: null, isResolving: true, unresolved: false })
      expect(mockedUseGetWorldScenes).toHaveBeenCalledWith({ worldName: 'world.dcl.eth' }, { skip: false })
    })
  })

  describe('when a world realm resolves to a base parcel', () => {
    it('should return the first scene base as the position', () => {
      setParams('realm=world.dcl.eth')
      setScenes({ data: [{ title: 'A', baseParcel: '100,100' }], isError: false })
      expect(render().current).toEqual({ realm: 'world.dcl.eth', position: '100,100', isResolving: false, unresolved: false })
    })

    it('should resolve hyphenated world names (regression: isEns must accept "-")', () => {
      setParams('realm=common-ground.dcl.eth')
      setScenes({ data: [{ title: 'A', baseParcel: '77,-8' }], isError: false })
      expect(render().current).toEqual({ realm: 'common-ground.dcl.eth', position: '77,-8', isResolving: false, unresolved: false })
      expect(mockedUseGetWorldScenes).toHaveBeenCalledWith({ worldName: 'common-ground.dcl.eth' }, { skip: false })
    })
  })

  describe('when a world realm keeps a resolved base despite a background refetch error', () => {
    it('should keep the cached base and not report unresolved', () => {
      setParams('realm=world.dcl.eth')
      setScenes({ data: [{ title: 'A', baseParcel: '3,4' }], isError: true })
      expect(render().current).toEqual({ realm: 'world.dcl.eth', position: '3,4', isResolving: false, unresolved: false })
    })
  })

  describe('when a world realm returns no scenes', () => {
    it('should report unresolved with a null position', () => {
      setParams('realm=world.dcl.eth')
      setScenes({ data: [], isError: false })
      expect(render().current).toEqual({ realm: 'world.dcl.eth', position: null, isResolving: false, unresolved: true })
    })
  })

  describe('when the scene fetch errors', () => {
    it('should report unresolved with a null position', () => {
      setParams('realm=world.dcl.eth')
      setScenes({ data: undefined, isError: true })
      expect(render().current).toEqual({ realm: 'world.dcl.eth', position: null, isResolving: false, unresolved: true })
    })
  })
})
