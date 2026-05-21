import { act, renderHook, waitFor } from '@testing-library/react'
import { fetchCastWatcherToken, fetchSceneAdapter } from '../features/discover/sceneAdapter'
import { useSceneRoom } from './useSceneRoom'

jest.mock('../features/discover/sceneAdapter', () => ({
  fetchSceneAdapter: jest.fn(),
  fetchCastWatcherToken: jest.fn()
}))

jest.mock('../features/cast2/cast2.utils', () => ({
  generateRandomName: () => 'guest-fixed'
}))

const fetchSceneAdapterMock = fetchSceneAdapter as jest.MockedFunction<typeof fetchSceneAdapter>
const fetchCastWatcherTokenMock = fetchCastWatcherToken as jest.MockedFunction<typeof fetchCastWatcherToken>

describe('useSceneRoom', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when location is empty', () => {
    it('stays in loading state and never fetches', async () => {
      const { result } = renderHook(() => useSceneRoom({ location: '' }))

      // Effect runs once and bails before either fetch.
      await Promise.resolve()
      expect(result.current.status).toBe('loading')
      expect(fetchSceneAdapterMock).not.toHaveBeenCalled()
      expect(fetchCastWatcherTokenMock).not.toHaveBeenCalled()
    })
  })

  describe('when the scene adapter succeeds', () => {
    beforeEach(() => {
      fetchSceneAdapterMock.mockResolvedValue({ url: 'wss://scene', token: 'scene-token' })
    })

    it('transitions to ready in scene mode with the adapter credentials', async () => {
      const { result } = renderHook(() => useSceneRoom({ location: '0,0' }))

      await waitFor(() => expect(result.current.status).toBe('ready'))
      expect(result.current.mode).toBe('scene')
      expect(result.current.credentials).toEqual({ url: 'wss://scene', token: 'scene-token', identity: 'guest', roomId: '' })
      expect(fetchCastWatcherTokenMock).not.toHaveBeenCalled()
    })

    it('passes world args when the location is an ENS name', async () => {
      renderHook(() => useSceneRoom({ location: 'world.dcl.eth', parcel: '0,0', sceneId: 'entity-1' }))

      await waitFor(() => expect(fetchSceneAdapterMock).toHaveBeenCalled())
      expect(fetchSceneAdapterMock).toHaveBeenCalledWith({
        worldName: 'world.dcl.eth',
        parcel: '0,0',
        sceneId: 'entity-1',
        identity: undefined
      })
    })
  })

  describe('when the scene adapter returns null', () => {
    beforeEach(() => {
      fetchSceneAdapterMock.mockResolvedValue(null)
    })

    describe('and the cast watcher fallback succeeds', () => {
      beforeEach(() => {
        fetchCastWatcherTokenMock.mockResolvedValue({ url: 'wss://cast', token: 'cast-token' })
      })

      it('transitions to ready in cast mode with the generated guest identity', async () => {
        const { result } = renderHook(() => useSceneRoom({ location: '0,0' }))

        await waitFor(() => expect(result.current.status).toBe('ready'))
        expect(result.current.mode).toBe('cast')
        expect(result.current.credentials).toEqual({ url: 'wss://cast', token: 'cast-token', identity: 'guest-fixed', roomId: '' })
      })
    })

    describe('and the cast watcher fallback returns null', () => {
      beforeEach(() => {
        fetchCastWatcherTokenMock.mockResolvedValue(null)
      })

      it('transitions to no-broadcast', async () => {
        const { result } = renderHook(() => useSceneRoom({ location: '0,0' }))

        await waitFor(() => expect(result.current.status).toBe('no-broadcast'))
        expect(result.current.credentials).toBeNull()
      })
    })
  })

  describe('when retry is called', () => {
    it('re-fires the fetch pipeline', async () => {
      fetchSceneAdapterMock.mockResolvedValue(null)
      fetchCastWatcherTokenMock.mockResolvedValue(null)

      const { result } = renderHook(() => useSceneRoom({ location: '0,0' }))
      await waitFor(() => expect(result.current.status).toBe('no-broadcast'))

      fetchSceneAdapterMock.mockResolvedValue({ url: 'wss://scene', token: 'scene-token' })
      act(() => {
        result.current.retry()
      })

      await waitFor(() => expect(result.current.status).toBe('ready'))
      expect(result.current.mode).toBe('scene')
    })
  })
})
