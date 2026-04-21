import { act, renderHook, waitFor } from '@testing-library/react'
import { useProfileAvatar } from './useProfileAvatar'
import type { UseProfileAvatarResult } from './useProfileAvatar'

const mockUseGetProfileQuery = jest.fn()

jest.mock('../features/profile/profile.client', () => ({
  useGetProfileQuery: (address: string | undefined, options?: { skip?: boolean }) => mockUseGetProfileQuery(address, options)
}))

type ImageMock = {
  src: string
  onerror: (() => void) | null
  srcAssignments: string[]
}

type RenderedHook = {
  result: { current: UseProfileAvatarResult }
  unmount: () => void
}

describe('when useProfileAvatar is called', () => {
  let imageInstances: ImageMock[]
  let originalImage: typeof Image

  beforeEach(() => {
    imageInstances = []
    originalImage = window.Image

    class FakeImage {
      onerror: (() => void) | null = null
      srcAssignments: string[] = []
      #src = ''
      get src(): string {
        return this.#src
      }
      set src(value: string) {
        this.#src = value
        this.srcAssignments.push(value)
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

  describe('and the address is undefined', () => {
    let rendered: RenderedHook

    beforeEach(() => {
      mockUseGetProfileQuery.mockReturnValue({ data: null, isLoading: false })
      rendered = renderHook(() => useProfileAvatar(undefined)) as RenderedHook
    })

    it('should return an undefined avatar', () => {
      expect(rendered.result.current.avatar).toBeUndefined()
    })

    it('should return an undefined avatarForCard', () => {
      expect(rendered.result.current.avatarForCard).toBeUndefined()
    })

    it('should return an undefined avatarFace', () => {
      expect(rendered.result.current.avatarFace).toBeUndefined()
    })

    it('should return an undefined name', () => {
      expect(rendered.result.current.name).toBeUndefined()
    })
  })

  describe('and the profile has no face256 snapshot', () => {
    let rendered: RenderedHook

    beforeEach(() => {
      mockUseGetProfileQuery.mockReturnValue({
        data: { avatars: [{ name: 'SomeUser', avatar: { snapshots: {} } }] },
        isLoading: false
      })
      rendered = renderHook(() => useProfileAvatar('0xabc')) as RenderedHook
    })

    it('should return an undefined avatarFace', () => {
      expect(rendered.result.current.avatarFace).toBeUndefined()
    })

    it('should return the profile name', () => {
      expect(rendered.result.current.name).toBe('SomeUser')
    })
  })

  describe('and the face256 URL loads successfully', () => {
    let okUrl: string
    let rendered: RenderedHook

    beforeEach(() => {
      okUrl = 'https://cdn.test/face-ok.png'
      mockUseGetProfileQuery.mockReturnValue({
        data: { avatars: [{ name: 'Alice', avatar: { snapshots: { face256: okUrl } } }] },
        isLoading: false
      })
      rendered = renderHook(() => useProfileAvatar('0xalice')) as RenderedHook
    })

    it('should expose the URL as avatarFace', () => {
      expect(rendered.result.current.avatarFace).toBe(okUrl)
    })

    it('should keep the URL after effects flush', async () => {
      await waitFor(() => expect(rendered.result.current.avatarFace).toBe(okUrl))
    })

    it('should return the same reference for avatar and avatarForCard', () => {
      expect(rendered.result.current.avatarForCard).toBe(rendered.result.current.avatar)
    })
  })

  describe('and the face256 URL fails to load', () => {
    let brokenUrl: string
    let rendered: RenderedHook

    beforeEach(() => {
      brokenUrl = 'https://cdn.test/face-broken.png'
      mockUseGetProfileQuery.mockReturnValue({
        data: { avatars: [{ name: 'Bob', avatar: { snapshots: { face256: brokenUrl } } }] },
        isLoading: false
      })
      rendered = renderHook(() => useProfileAvatar('0xbob')) as RenderedHook
    })

    describe('and the Image onerror handler has fired', () => {
      beforeEach(async () => {
        act(() => {
          imageInstances[imageInstances.length - 1]?.onerror?.()
        })
        await waitFor(() => expect(rendered.result.current.avatarFace).toBeUndefined())
      })

      it('should set avatarFace to undefined', () => {
        expect(rendered.result.current.avatarFace).toBeUndefined()
      })

      it('should blank face256 on avatarForCard', () => {
        expect(rendered.result.current.avatarForCard?.avatar?.snapshots?.face256).toBeUndefined()
      })

      it('should preserve the profile name on avatarForCard', () => {
        expect(rendered.result.current.avatarForCard?.name).toBe('Bob')
      })
    })

    describe('and a second hook instance renders after the URL is known to be broken', () => {
      let secondRendered: RenderedHook

      beforeEach(async () => {
        act(() => {
          imageInstances[imageInstances.length - 1]?.onerror?.()
        })
        await waitFor(() => expect(rendered.result.current.avatarFace).toBeUndefined())
        secondRendered = renderHook(() => useProfileAvatar('0xbob')) as RenderedHook
      })

      it('should return undefined avatarFace without re-probing the URL', () => {
        expect(secondRendered.result.current.avatarFace).toBeUndefined()
      })
    })
  })

  describe('and the hook mounts with an in-flight image request', () => {
    let inFlightUrl: string
    let rendered: RenderedHook

    beforeEach(() => {
      inFlightUrl = 'https://cdn.test/in-flight.png'
      mockUseGetProfileQuery.mockReturnValue({
        data: { avatars: [{ name: 'Charlie', avatar: { snapshots: { face256: inFlightUrl } } }] },
        isLoading: false
      })
      rendered = renderHook(() => useProfileAvatar('0xcharlie')) as RenderedHook
    })

    it('should assign the URL to Image.src', () => {
      expect(imageInstances[imageInstances.length - 1]?.srcAssignments).toEqual([inFlightUrl])
    })

    describe('and the hook unmounts before the image resolves', () => {
      beforeEach(() => {
        rendered.unmount()
      })

      it('should clear Image.src to abort the in-flight request', () => {
        expect(imageInstances[imageInstances.length - 1]?.srcAssignments).toEqual([inFlightUrl, ''])
      })
    })
  })
})
