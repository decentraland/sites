import { renderHook, waitFor } from '@testing-library/react'
import { useReelImagesByUser } from './useReelImagesByUser'

jest.mock('../features/reels', () => ({
  fetchImagesByUser: jest.fn()
}))

const reelsMock = jest.requireMock('../features/reels')

describe('useReelImagesByUser', () => {
  beforeEach(() => {
    reelsMock.fetchImagesByUser.mockReset()
  })

  describe('when address is undefined', () => {
    it('should not fetch and stay idle', () => {
      const { result } = renderHook(() => useReelImagesByUser(undefined, { limit: 24, offset: 0 }))
      expect(result.current).toEqual({ images: [], total: 0, isLoading: false, error: null })
      expect(reelsMock.fetchImagesByUser).not.toHaveBeenCalled()
    })
  })

  describe('when address is provided', () => {
    it('should resolve with the fetched images and total', async () => {
      const fakeImages = [{ id: '1' }, { id: '2' }]
      reelsMock.fetchImagesByUser.mockResolvedValue({
        images: fakeImages,
        currentImages: 2,
        maxImages: 50
      })
      const { result } = renderHook(() => useReelImagesByUser('0xabc', { limit: 24, offset: 0 }))
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.images).toHaveLength(2)
      expect(result.current.total).toBe(2)
    })

    it('should expose the error when the fetch fails', async () => {
      reelsMock.fetchImagesByUser.mockRejectedValue(new Error('boom'))
      const { result } = renderHook(() => useReelImagesByUser('0xabc', { limit: 24, offset: 0 }))
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.error?.message).toBe('boom')
      expect(result.current.images).toEqual([])
    })

    it('should forward the identity to the fetch so the owner gallery is signed', async () => {
      const identity = { authChain: [] } as unknown as Parameters<typeof useReelImagesByUser>[2]
      reelsMock.fetchImagesByUser.mockResolvedValue({ images: [], currentImages: 0, maxImages: 0 })
      renderHook(() => useReelImagesByUser('0xabc', { limit: 24, offset: 0 }, identity))
      await waitFor(() => expect(reelsMock.fetchImagesByUser).toHaveBeenCalled())
      expect(reelsMock.fetchImagesByUser).toHaveBeenCalledWith('0xabc', { limit: 24, offset: 0 }, expect.anything(), identity)
    })
  })
})
