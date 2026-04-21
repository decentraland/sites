import { act, renderHook, waitFor } from '@testing-library/react'
import { useCreatorAvatar } from './useCreatorAvatar'

type ImageInstance = { onerror: ((...args: unknown[]) => void) | null; src: string }

describe('useCreatorAvatar', () => {
  let created: ImageInstance[]
  let originalImage: typeof Image

  beforeEach(() => {
    created = []
    originalImage = global.Image
    ;(global as unknown as { Image: unknown }).Image = class {
      public onerror: ((...args: unknown[]) => void) | null = null
      private _src = ''
      get src() {
        return this._src
      }
      set src(value: string) {
        this._src = value
        if (value) created.push(this as unknown as ImageInstance)
      }
    }
  })

  afterEach(() => {
    ;(global as unknown as { Image: typeof Image }).Image = originalImage
  })

  describe('when no address is provided', () => {
    it('should return undefined avatar and face', () => {
      const { result } = renderHook(() => useCreatorAvatar(undefined))

      expect(result.current.avatar).toBeUndefined()
      expect(result.current.avatarFace).toBeUndefined()
    })
  })

  describe('when a valid address is provided', () => {
    it('should return an avatar with the profile-images face URL', () => {
      const { result } = renderHook(() => useCreatorAvatar('0xabc', 'Alice'))

      expect(result.current.avatarFace).toBe('https://profile-images.decentraland.org/entities/0xabc/face.png')
      expect(result.current.avatar?.name).toBe('Alice')
      // face256 is the same URL before any error fires
      expect((result.current.avatar as unknown as { avatar: { snapshots: { face256: string } } }).avatar.snapshots.face256).toBe(
        'https://profile-images.decentraland.org/entities/0xabc/face.png'
      )
    })
  })

  describe('when the face image fails to load', () => {
    it('should clear the face256 so callers can fall back to a placeholder', async () => {
      const { result } = renderHook(() => useCreatorAvatar('0xbadprofile', 'Broken'))

      expect(created.length).toBe(1)

      act(() => {
        created[0]?.onerror?.()
      })

      await waitFor(() => {
        expect(result.current.avatarFace).toBeUndefined()
      })
      expect((result.current.avatar as unknown as { avatar: { snapshots: { face256: string } } }).avatar.snapshots.face256).toBe('')
    })

    it('should remember the broken URL so sibling cards skip the retry on mount', async () => {
      const first = renderHook(() => useCreatorAvatar('0xsharedbroken'))
      act(() => {
        created[0]?.onerror?.()
      })
      await waitFor(() => {
        expect(first.result.current.avatarFace).toBeUndefined()
      })

      const priorCount = created.length
      renderHook(() => useCreatorAvatar('0xsharedbroken'))

      // No new Image probe was started because the URL was already marked broken.
      expect(created.length).toBe(priorCount)
    })
  })
})
