import { act, renderHook } from '@testing-library/react'
import { useReloadEmptyImages } from './useReloadEmptyImages'

const createImage = (src: string | null, { complete, naturalWidth }: { complete: boolean; naturalWidth: number }) => {
  const image = document.createElement('img')
  if (src) image.setAttribute('src', src)
  Object.defineProperty(image, 'complete', { value: complete, configurable: true })
  Object.defineProperty(image, 'naturalWidth', { value: naturalWidth, configurable: true })
  return image
}

describe('when reloading the images the browser left empty', () => {
  let root: HTMLDivElement
  let sources: string[]

  const track = (image: HTMLImageElement) => {
    const setAttribute = image.setAttribute.bind(image)
    jest.spyOn(image, 'setAttribute').mockImplementation((name: string, value: string) => {
      if (name === 'src') sources.push(value)
      setAttribute(name, value)
    })
    return image
  }

  const mount = (enabled: boolean) => renderHook(({ on }) => useReloadEmptyImages({ current: root }, on), { initialProps: { on: enabled } })

  beforeEach(() => {
    jest.useFakeTimers()
    sources = []
    root = document.createElement('div')
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  describe('and an image is complete with no size', () => {
    beforeEach(() => {
      root.append(track(createImage('/one.webp', { complete: true, naturalWidth: 0 })))
    })

    it('should request it again', () => {
      mount(true)

      act(() => {
        jest.advanceTimersByTime(500)
      })

      expect(sources).toEqual(['/one.webp'])
    })

    it('should wait while it is not enabled', () => {
      mount(false)

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(sources).toEqual([])
    })

    it('should keep retrying at most five times', () => {
      mount(true)

      act(() => {
        jest.advanceTimersByTime(60000)
      })

      expect(sources).toHaveLength(5)
    })

    it('should stop its timer when it unmounts', () => {
      const { unmount } = mount(true)
      unmount()

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(sources).toEqual([])
    })
  })

  describe('and an image is still loading', () => {
    it('should not touch it', () => {
      root.append(track(createImage('/loading.webp', { complete: false, naturalWidth: 0 })))
      mount(true)

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(sources).toEqual([])
    })
  })

  describe('and an image has no source', () => {
    it('should not touch it', () => {
      root.append(track(createImage(null, { complete: true, naturalWidth: 0 })))
      mount(true)

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(sources).toEqual([])
    })
  })

  describe('and every image loaded', () => {
    it('should stop checking after the first pass', () => {
      root.append(track(createImage('/ok.webp', { complete: true, naturalWidth: 788 })))
      mount(true)

      act(() => {
        jest.advanceTimersByTime(500)
      })

      expect(jest.getTimerCount()).toBe(0)
      expect(sources).toEqual([])
    })
  })

  describe('and there is no root element', () => {
    it('should do nothing', () => {
      renderHook(() => useReloadEmptyImages({ current: null }, true))

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(jest.getTimerCount()).toBe(0)
    })
  })
})
