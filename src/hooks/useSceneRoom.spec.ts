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
        sceneId: 'entity-1'
      })
    })

    // Regression: signing the gatekeeper request as the visitor's wallet made
    // LiveKit evict their Explorer session from the same room.
    it('should never forward a wallet identity to the scene adapter', async () => {
      renderHook(() => useSceneRoom({ location: '0,0' }))

      await waitFor(() => expect(fetchSceneAdapterMock).toHaveBeenCalled())
      expect(fetchSceneAdapterMock).toHaveBeenCalledWith({ parcel: '0,0' })
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

  // The effect cancels itself when `location` changes. Without that guard a slow
  // response for the location the user just left would overwrite the new one.
  describe('when the location changes while a scene-adapter call is in flight', () => {
    it('should ignore the stale response instead of falling through to the cast watcher', async () => {
      let resolveStale: (value: null) => void = () => undefined
      fetchSceneAdapterMock
        .mockReturnValueOnce(new Promise(resolve => (resolveStale = resolve)))
        .mockResolvedValue({ url: 'wss://fresh', token: 'fresh-token' })

      const { result, rerender } = renderHook(({ location }) => useSceneRoom({ location }), {
        initialProps: { location: '0,0' }
      })
      rerender({ location: '1,1' })
      await waitFor(() => expect(result.current.status).toBe('ready'))

      // The abandoned '0,0' call resolves last and returns no credentials: if it
      // were still live it would fall through to the cast-watcher fallback.
      resolveStale(null)
      await waitFor(() => expect(result.current.credentials?.token).toBe('fresh-token'))
      expect(fetchCastWatcherTokenMock).not.toHaveBeenCalled()
    })
  })

  describe('when the location changes while a cast-watcher call is in flight', () => {
    it('should ignore the stale credentials', async () => {
      fetchSceneAdapterMock.mockResolvedValue(null)
      let resolveStale: (value: { url: string; token: string }) => void = () => undefined
      fetchCastWatcherTokenMock
        .mockReturnValueOnce(new Promise(resolve => (resolveStale = resolve)))
        .mockResolvedValue({ url: 'wss://fresh', token: 'fresh-token' })

      const { result, rerender } = renderHook(({ location }) => useSceneRoom({ location }), {
        initialProps: { location: '0,0' }
      })
      await waitFor(() => expect(fetchCastWatcherTokenMock).toHaveBeenCalled())
      rerender({ location: '1,1' })
      await waitFor(() => expect(result.current.credentials?.token).toBe('fresh-token'))

      // `act` flushes the resolution's state update, so a missing guard would
      // visibly clobber the fresh credentials rather than silently no-op.
      await act(async () => {
        resolveStale({ url: 'wss://stale', token: 'stale-token' })
      })
      expect(result.current.credentials?.token).toBe('fresh-token')
    })
  })
})
