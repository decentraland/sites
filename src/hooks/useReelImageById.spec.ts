import { renderHook, waitFor } from '@testing-library/react'
import { useReelImageById } from './useReelImageById'

jest.mock('../features/reels', () => ({
  fetchImageById: jest.fn(),
  enrichWearables: jest.fn(async (users: unknown) => users),
  fetchProfileFaces: jest.fn(async () => new Map<string, string>())
}))

const reelsMock = jest.requireMock('../features/reels')

describe('useReelImageById', () => {
  beforeEach(() => {
    reelsMock.fetchImageById.mockReset()
    reelsMock.enrichWearables.mockImplementation(async (users: unknown) => users)
  })

  describe('when id is undefined', () => {
    it('should not fetch and stay idle', () => {
      const { result } = renderHook(() => useReelImageById(undefined))
      expect(result.current).toEqual({ image: null, isLoading: false, error: null })
      expect(reelsMock.fetchImageById).not.toHaveBeenCalled()
    })
  })

  describe('when id is provided', () => {
    it('should resolve with the fetched image', async () => {
      const fakeImage = {
        id: 'x',
        url: 'u',
        thumbnailUrl: 't',
        metadata: {
          visiblePeople: [],
          dateTime: '',
          userName: '',
          userAddress: '',
          realm: '',
          scene: { name: '', location: { x: '0', y: '0' } }
        }
      }
      reelsMock.fetchImageById.mockResolvedValue(fakeImage)
      const { result } = renderHook(() => useReelImageById('x'))
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.image?.id).toBe('x')
      expect(result.current.error).toBeNull()
    })

    it('should expose the error when the fetch fails', async () => {
      reelsMock.fetchImageById.mockRejectedValue(new Error('not found'))
      const { result } = renderHook(() => useReelImageById('y'))
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.error?.message).toBe('not found')
      expect(result.current.image).toBeNull()
    })

    it('should wrap non-Error rejections so the state still has an Error instance', async () => {
      reelsMock.fetchImageById.mockRejectedValue('bonk')
      const { result } = renderHook(() => useReelImageById('z'))
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.error?.message).toBe('bonk')
    })

    it('should merge enriched wearables and face URLs into the visible people array', async () => {
      const person = { userAddress: '0xABC', userName: 'Alice', isGuest: false, wearables: [] }
      reelsMock.fetchImageById.mockResolvedValue({
        id: 'z2',
        url: 'u',
        thumbnailUrl: 't',
        metadata: {
          visiblePeople: [person],
          dateTime: '',
          userName: '',
          userAddress: '',
          realm: '',
          scene: { name: '', location: { x: '0', y: '0' } }
        }
      })
      reelsMock.enrichWearables.mockResolvedValueOnce([{ ...person, wearablesParsed: [] }])
      reelsMock.fetchProfileFaces.mockResolvedValueOnce(new Map([['0xabc', 'face256.png']]))
      const { result } = renderHook(() => useReelImageById('z2'))
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.image?.metadata.visiblePeople[0]).toMatchObject({
        userAddress: '0xABC',
        faceUrl: 'face256.png'
      })
    })
  })
})
