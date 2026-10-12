import HlsJs from 'hls.js'
import { attachHls } from './hlsSource'

jest.mock('hls.js', () => ({
  __esModule: true,
  default: Object.assign(jest.fn(), { isSupported: jest.fn(), Events: { ERROR: 'hlsError' } })
}))

const SRC = 'https://player.vimeo.com/external/123456.m3u8?s=abc'

describe('when an HLS source is attached', () => {
  let video: HTMLVideoElement
  let hls: { loadSource: jest.Mock; attachMedia: jest.Mock; destroy: jest.Mock; on: jest.Mock }
  let onFatal: jest.Mock

  beforeEach(() => {
    video = document.createElement('video')
    hls = { loadSource: jest.fn(), attachMedia: jest.fn(), destroy: jest.fn(), on: jest.fn() }
    onFatal = jest.fn()
    jest.mocked(HlsJs).mockImplementation(() => hls as never)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  describe('and the browser plays HLS natively', () => {
    let cleanup: () => void

    beforeEach(async () => {
      jest.spyOn(video, 'canPlayType').mockReturnValue('maybe')
      cleanup = await attachHls(video, SRC, onFatal)
    })

    it('should set the source on the video element', () => {
      expect(video.src).toBe(SRC)
    })

    it('should not load hls.js', () => {
      expect(HlsJs).not.toHaveBeenCalled()
    })

    it('should return a cleanup that does nothing', () => {
      expect(cleanup()).toBeUndefined()
    })
  })

  describe('and the browser needs hls.js', () => {
    let cleanup: () => void

    beforeEach(async () => {
      jest.spyOn(HlsJs, 'isSupported').mockReturnValue(true)
      cleanup = await attachHls(video, SRC, onFatal)
    })

    it('should load the source', () => {
      expect(hls.loadSource).toHaveBeenCalledWith(SRC)
    })

    it('should attach the video element', () => {
      expect(hls.attachMedia).toHaveBeenCalledWith(video)
    })

    describe.each([
      ['a fatal error', true, 1],
      ['a recoverable error', false, 0]
    ])('and hls.js reports %s', (_, fatal, calls) => {
      beforeEach(() => {
        const [event, listener] = hls.on.mock.calls[0]
        listener(event, { fatal })
      })

      it(`should report ${calls} failure(s)`, () => {
        expect(onFatal).toHaveBeenCalledTimes(calls)
      })
    })

    it('should listen for hls.js errors', () => {
      expect(hls.on).toHaveBeenCalledWith('hlsError', expect.any(Function))
    })

    describe('and the cleanup runs', () => {
      beforeEach(() => {
        cleanup()
      })

      it('should destroy the hls.js instance', () => {
        expect(hls.destroy).toHaveBeenCalled()
      })
    })
  })

  describe('and the browser supports neither', () => {
    let attached: Promise<() => void>

    beforeEach(() => {
      jest.spyOn(HlsJs, 'isSupported').mockReturnValue(false)
      attached = attachHls(video, SRC, onFatal)
    })

    it('should reject', async () => {
      await expect(attached).rejects.toThrow('HLS is not supported')
    })
  })
})
