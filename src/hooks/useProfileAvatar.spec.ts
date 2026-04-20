import { act, renderHook, waitFor } from '@testing-library/react'
import { useProfileAvatar } from './useProfileAvatar'

const mockUseGetProfileQuery = jest.fn()

jest.mock('../features/profile/profile.client', () => ({
  useGetProfileQuery: (address: string | undefined, options?: { skip?: boolean }) => mockUseGetProfileQuery(address, options)
}))

type ImageMock = {
  set src(value: string)
  onerror: (() => void) | null
}

const imageInstances: ImageMock[] = []

describe('useProfileAvatar', () => {
  let originalImage: typeof Image

  beforeEach(() => {
    imageInstances.length = 0
    originalImage = window.Image

    class FakeImage {
      onerror: (() => void) | null = null
      #src = ''
      get src(): string {
        return this.#src
      }
      set src(value: string) {
        this.#src = value
      }
      constructor() {
        imageInstances.push(this as unknown as ImageMock)
      }
    }
    ;(window as unknown as { Image: typeof Image }).Image = FakeImage as unknown as typeof Image
  })

  afterEach(() => {
    ;(window as unknown as { Image: typeof Image }).Image = originalImage
    jest.resetAllMocks()
  })

  describe('when the address is empty', () => {
    beforeEach(() => {
      mockUseGetProfileQuery.mockReturnValue({ data: null, isLoading: false })
    })

    it('should return undefined avatar fields', () => {
      const { result } = renderHook(() => useProfileAvatar(undefined))

      expect(result.current.avatar).toBeUndefined()
      expect(result.current.avatarFace).toBeUndefined()
      expect(result.current.name).toBeUndefined()
    })
  })

  describe('when the profile has no avatar snapshot', () => {
    beforeEach(() => {
      mockUseGetProfileQuery.mockReturnValue({
        data: { avatars: [{ name: 'SomeUser', avatar: { snapshots: {} } }] },
        isLoading: false
      })
    })

    it('should return an undefined avatarFace', () => {
      const { result } = renderHook(() => useProfileAvatar('0xabc'))

      expect(result.current.avatarFace).toBeUndefined()
      expect(result.current.name).toBe('SomeUser')
    })
  })

  describe('when the face256 URL loads successfully', () => {
    beforeEach(() => {
      mockUseGetProfileQuery.mockReturnValue({
        data: {
          avatars: [{ name: 'Alice', avatar: { snapshots: { face256: 'https://cdn.test/face-ok.png' } } }]
        },
        isLoading: false
      })
    })

    it('should expose the URL as avatarFace and keep it after effects flush', async () => {
      const { result } = renderHook(() => useProfileAvatar('0xalice'))

      expect(result.current.avatarFace).toBe('https://cdn.test/face-ok.png')
      await waitFor(() => expect(result.current.avatarFace).toBe('https://cdn.test/face-ok.png'))
    })
  })

  describe('when the face256 URL fails to load', () => {
    const brokenUrl = 'https://cdn.test/face-broken.png'

    beforeEach(() => {
      mockUseGetProfileQuery.mockReturnValue({
        data: {
          avatars: [{ name: 'Bob', avatar: { snapshots: { face256: brokenUrl } } }]
        },
        isLoading: false
      })
    })

    it('should fall back to undefined after the Image onerror fires', async () => {
      const { result } = renderHook(() => useProfileAvatar('0xbob'))

      expect(result.current.avatarFace).toBe(brokenUrl)

      act(() => {
        imageInstances[imageInstances.length - 1]?.onerror?.()
      })

      await waitFor(() => expect(result.current.avatarFace).toBeUndefined())
    })

    it('should memoize broken URLs across hook instances', async () => {
      const first = renderHook(() => useProfileAvatar('0xbob'))

      act(() => {
        imageInstances[imageInstances.length - 1]?.onerror?.()
      })
      await waitFor(() => expect(first.result.current.avatarFace).toBeUndefined())

      const second = renderHook(() => useProfileAvatar('0xbob'))

      expect(second.result.current.avatarFace).toBeUndefined()
    })
  })
})
