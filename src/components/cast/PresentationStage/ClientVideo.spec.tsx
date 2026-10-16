import React, { useLayoutEffect } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import type { SlideVideoInfo } from '../../../features/cast2/cast2.types'
import { usePresentation } from '../../../features/cast2/contexts/PresentationContext'
import type { PresentationState } from '../../../features/cast2/contexts/PresentationContext'
import { ClientVideo } from './ClientVideo'
import { attachHls } from './hlsSource'
import { createYouTubePlayer, loadYouTubeApi } from './youtubePlayer'
import type { ClientPlayerEvents, ClientPlayerHandle } from './ClientVideo.types'

jest.mock('decentraland-ui2', () => ({
  ...jest.requireActual('../../../__test-utils__/styledMock'),
  Button: ({ children, ...rest }: { children?: React.ReactNode }) => React.createElement('button', rest, children)
}))
jest.mock('../../../features/cast2/contexts/PresentationContext', () => ({ usePresentation: jest.fn() }))
jest.mock('../../../features/cast2/useCastTranslation', () => ({ useCastTranslation: () => ({ t: (key: string) => key }) }))
jest.mock('./youtubePlayer', () => ({ loadYouTubeApi: jest.fn(), createYouTubePlayer: jest.fn() }))
jest.mock('./hlsSource', () => ({ attachHls: jest.fn() }))
jest.mock('../../../features/cast2/cast2.helpers', () => ({ getPresenterServerUrl: () => 'https://presenter.example' }))

const NOW = 1_700_000_000_000
const GEOMETRY = { x: 0, y: 0, width: 960, height: 540 }
const YOUTUBE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
const DRIVE_URL = 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view'
const DRIVE_SRC = 'https://presenter.example/api/drive-video?fileId=1AbCdEfGhIjKlMnOp'
const VIMEO_URL = 'https://player.vimeo.com/external/123456.m3u8?s=abc'
const UNMUTE = { name: 'streaming_controls.click_to_unmute' }
const FAILURE = '[presentation] client video failed'

const flush = () => act(async () => undefined)

describe('when a YouTube client video renders', () => {
  let state: PresentationState
  let handle: jest.Mocked<ClientPlayerHandle>
  let events: ClientPlayerEvents
  let warn: jest.SpyInstance
  let result: RenderResult
  let video: SlideVideoInfo

  const mount = async (muted = false) => {
    result = render(<ClientVideo video={video} muted={muted} />)
    await flush()
  }
  const ready = () => act(() => events.onReady())

  beforeEach(() => {
    jest.useFakeTimers({ now: NOW })
    state = { videoState: 'playing', videoPositionMs: 10_000, videoPositionAt: NOW } as PresentationState
    video = { url: YOUTUBE_URL, geometry: GEOMETRY, source: 'client' }
    handle = {
      play: jest.fn(),
      pause: jest.fn(),
      seekTo: jest.fn(),
      currentTimeMs: jest.fn().mockReturnValue(0),
      durationMs: jest.fn().mockReturnValue(null),
      isPlaying: jest.fn().mockReturnValue(false),
      isBusy: jest.fn().mockReturnValue(false),
      setMuted: jest.fn(),
      destroy: jest.fn()
    }
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    jest.mocked(usePresentation).mockImplementation(() => ({ state }) as never)
    jest.mocked(loadYouTubeApi).mockResolvedValue()
    jest.mocked(createYouTubePlayer).mockImplementation((_container, _id, playerEvents) => {
      events = playerEvents
      return handle
    })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  describe('and the API loads', () => {
    beforeEach(() => mount())

    it('should create the player in a container with the parsed id', () => {
      expect(createYouTubePlayer).toHaveBeenCalledWith(expect.any(HTMLDivElement), 'dQw4w9WgXcQ', expect.any(Object))
    })

    it('should not play before the player is ready', () => {
      expect(handle.play).not.toHaveBeenCalled()
    })

    it('should keep keyboard focus out of the player', () => {
      expect(result.container.firstElementChild).toHaveAttribute('inert')
    })
  })

  describe('and it unmounts before the API loads', () => {
    beforeEach(async () => {
      result = render(<ClientVideo video={video} muted={false} />)
      result.unmount()
      await flush()
    })

    it('should not create the player', () => {
      expect(createYouTubePlayer).not.toHaveBeenCalled()
    })
  })

  describe('and the player becomes ready 10 s into a playing video', () => {
    beforeEach(async () => {
      await mount()
      ready()
    })

    it('should seek to the live position', () => {
      expect(handle.seekTo).toHaveBeenCalledWith(10_000)
    })

    it('should play after seeking', () => {
      expect(handle.play.mock.invocationCallOrder[0]).toBeGreaterThan(handle.seekTo.mock.invocationCallOrder[0])
    })

    it('should apply the tab mute before playing', () => {
      expect(handle.setMuted.mock.invocationCallOrder[0]).toBeLessThan(handle.play.mock.invocationCallOrder[0])
    })

    describe('and the presenter pauses at 20 s', () => {
      beforeEach(() => {
        state = { ...state, videoState: 'paused', videoPositionMs: 20_000, videoPositionAt: NOW }
        result.rerender(<ClientVideo video={video} muted={false} />)
      })

      it('should seek to the paused position', () => {
        expect(handle.seekTo).toHaveBeenLastCalledWith(20_000)
      })

      it('should pause the player', () => {
        expect(handle.pause).toHaveBeenCalled()
      })

      it('should stop the sync timer', () => {
        expect(jest.getTimerCount()).toBe(0)
      })
    })

    describe('and the tab is muted afterwards', () => {
      beforeEach(() => {
        handle.setMuted.mockClear()
        result.rerender(<ClientVideo video={video} muted />)
      })

      it('should mute the player', () => {
        expect(handle.setMuted).toHaveBeenCalledWith(true)
      })
    })

    describe('and the player drifts while 5 s pass', () => {
      beforeEach(() => {
        handle.seekTo.mockClear()
        act(() => {
          jest.advanceTimersByTime(5000)
        })
      })

      it('should re-seek to the advanced live position', () => {
        expect(handle.seekTo).toHaveBeenCalledWith(15_000)
      })
    })

    describe('and the video ends locally while the server still plays', () => {
      beforeEach(() => {
        act(() => events.onEnded())
        handle.play.mockClear()
        handle.seekTo.mockClear()
        act(() => {
          jest.advanceTimersByTime(5000)
        })
      })

      it('should not play again', () => {
        expect(handle.play).not.toHaveBeenCalled()
      })

      it('should not seek again', () => {
        expect(handle.seekTo).not.toHaveBeenCalled()
      })

      describe('and the presenter restarts the video afterwards', () => {
        beforeEach(() => {
          state = { ...state, videoPositionMs: 3_000, videoPositionAt: Date.now() }
          result.rerender(<ClientVideo video={video} muted={false} />)
        })

        it('should seek to the restarted position', () => {
          expect(handle.seekTo).toHaveBeenCalledWith(3_000)
        })

        it('should resume playing', () => {
          expect(handle.play).toHaveBeenCalled()
        })
      })

      describe('and the presenter advances toward the end without restarting', () => {
        beforeEach(() => {
          handle.durationMs.mockReturnValue(12_000)
          state = { ...state, videoPositionMs: 11_000, videoPositionAt: Date.now() }
          result.rerender(<ClientVideo video={video} muted={false} />)
        })

        it('should not replay the ended video', () => {
          expect(handle.play).not.toHaveBeenCalled()
        })

        it('should not seek', () => {
          expect(handle.seekTo).not.toHaveBeenCalled()
        })
      })
    })

    describe('and it unmounts', () => {
      beforeEach(() => {
        result.unmount()
      })

      it('should destroy the player', () => {
        expect(handle.destroy).toHaveBeenCalled()
      })

      it('should stop the sync timer', () => {
        expect(jest.getTimerCount()).toBe(0)
      })
    })
  })

  describe('and the player becomes ready while the video is paused', () => {
    beforeEach(async () => {
      state = { ...state, videoState: 'paused' }
      await mount()
      ready()
    })

    it('should seek to the paused position', () => {
      expect(handle.seekTo).toHaveBeenCalledWith(10_000)
    })

    it('should pause the player', () => {
      expect(handle.pause).toHaveBeenCalled()
    })

    it('should not play the player', () => {
      expect(handle.play).not.toHaveBeenCalled()
    })
  })

  describe.each([
    ['3 s behind the target', 7_000, 1],
    ['1 s behind the target', 9_000, 0]
  ])('and the player is %s', (_, currentTimeMs, seeks) => {
    beforeEach(async () => {
      handle.currentTimeMs.mockReturnValue(currentTimeMs)
      await mount()
      ready()
    })

    it(`should seek ${seeks} time(s)`, () => {
      expect(handle.seekTo).toHaveBeenCalledTimes(seeks)
    })
  })

  describe('and the player is buffering', () => {
    beforeEach(async () => {
      handle.isBusy.mockReturnValue(true)
      await mount()
      ready()
    })

    it('should not seek', () => {
      expect(handle.seekTo).not.toHaveBeenCalled()
    })
  })

  describe('and the target is past the end of the video', () => {
    beforeEach(async () => {
      handle.durationMs.mockReturnValue(8_000)
      await mount()
      ready()
    })

    it('should seek to the end', () => {
      expect(handle.seekTo).toHaveBeenCalledWith(8_000)
    })
  })

  describe('and the server sends no position', () => {
    beforeEach(async () => {
      state = { ...state, videoPositionMs: null, videoPositionAt: null }
      await mount()
      ready()
    })

    it('should not seek', () => {
      expect(handle.seekTo).not.toHaveBeenCalled()
    })

    it('should still play', () => {
      expect(handle.play).toHaveBeenCalled()
    })
  })

  describe('and the player is already playing', () => {
    beforeEach(async () => {
      handle.isPlaying.mockReturnValue(true)
      await mount()
      ready()
    })

    it('should not call play again', () => {
      expect(handle.play).not.toHaveBeenCalled()
    })
  })

  describe('and the tab is muted', () => {
    beforeEach(async () => {
      await mount(true)
      ready()
    })

    it('should mute the player', () => {
      expect(handle.setMuted).toHaveBeenCalledWith(true)
    })
  })

  describe('and the browser blocks unmuted autoplay', () => {
    beforeEach(async () => {
      await mount()
      ready()
      handle.play.mockClear()
      act(() => events.onAutoplayBlocked())
    })

    it('should show the unmute button', () => {
      expect(screen.getByRole('button', UNMUTE)).toBeInTheDocument()
    })

    it('should mute the player', () => {
      expect(handle.setMuted).toHaveBeenLastCalledWith(true)
    })

    it('should retry playing', () => {
      expect(handle.play).toHaveBeenCalled()
    })

    describe('and the viewer clicks the unmute button', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByRole('button', UNMUTE))
      })

      it('should unmute the player', () => {
        expect(handle.setMuted).toHaveBeenLastCalledWith(false)
      })

      it('should hide the unmute button', () => {
        expect(screen.queryByRole('button', UNMUTE)).not.toBeInTheDocument()
      })

      describe('and autoplay is blocked again on a later tick', () => {
        beforeEach(() => {
          handle.setMuted.mockClear()
          act(() => {
            events.onAutoplayBlocked()
            jest.advanceTimersByTime(5000)
          })
        })

        it('should never mute the player again', () => {
          expect(handle.setMuted).not.toHaveBeenCalledWith(true)
        })

        it('should keep the player', () => {
          expect(handle.destroy).not.toHaveBeenCalled()
        })
      })
    })

    describe('and the muted retry is refused too', () => {
      beforeEach(() => {
        handle.play.mockClear()
        act(() => events.onAutoplayBlocked())
      })

      it('should keep the player', () => {
        expect(handle.destroy).not.toHaveBeenCalled()
      })

      it('should keep the unmute button', () => {
        expect(screen.getByRole('button', UNMUTE)).toBeInTheDocument()
      })

      it('should keep the player muted', () => {
        expect(handle.setMuted).toHaveBeenLastCalledWith(true)
      })

      it('should leave the next play attempt to the sync timer', () => {
        expect(handle.play).not.toHaveBeenCalled()
      })
    })

    describe('and an earlier unmuted attempt is refused afterwards', () => {
      beforeEach(() => {
        act(() => events.onAutoplayBlocked())
      })

      it('should keep the player', () => {
        expect(handle.destroy).not.toHaveBeenCalled()
      })

      it('should keep the unmute button', () => {
        expect(screen.getByRole('button', UNMUTE)).toBeInTheDocument()
      })

      it('should keep the player muted', () => {
        expect(handle.setMuted).toHaveBeenLastCalledWith(true)
      })
    })
  })

  describe('and the browser blocks unmuted autoplay while the video is paused', () => {
    beforeEach(async () => {
      state = { ...state, videoState: 'paused' }
      await mount()
      ready()
      act(() => events.onAutoplayBlocked())
    })

    it('should show the unmute button', () => {
      expect(screen.getByRole('button', UNMUTE)).toBeInTheDocument()
    })

    it('should mute the player', () => {
      expect(handle.setMuted).toHaveBeenLastCalledWith(true)
    })

    it('should not play the player', () => {
      expect(handle.play).not.toHaveBeenCalled()
    })
  })

  describe('and autoplay is blocked in the same commit that the presenter pauses', () => {
    const RefuseOnCommit = ({ refuse }: { refuse: boolean }) => {
      useLayoutEffect(() => {
        if (refuse) events.onAutoplayBlocked()
      }, [refuse])
      return null
    }

    beforeEach(async () => {
      result = render(
        <>
          <ClientVideo video={video} muted={false} />
          <RefuseOnCommit refuse={false} />
        </>
      )
      await flush()
      ready()
      handle.play.mockClear()
      state = { ...state, videoState: 'paused' }
      result.rerender(
        <>
          <ClientVideo video={video} muted={false} />
          <RefuseOnCommit refuse />
        </>
      )
    })

    it('should show the unmute button', () => {
      expect(screen.getByRole('button', UNMUTE)).toBeInTheDocument()
    })

    it('should not play the player', () => {
      expect(handle.play).not.toHaveBeenCalled()
    })
  })

  describe('and the player reports an error', () => {
    beforeEach(async () => {
      await mount()
      act(() => events.onError())
    })

    it('should destroy the player', () => {
      expect(handle.destroy).toHaveBeenCalled()
    })

    it('should render nothing', () => {
      expect(result.container).toBeEmptyDOMElement()
    })

    it('should warn with the player kind only', () => {
      expect(warn).toHaveBeenCalledWith(FAILURE, 'youtube')
    })
  })

  describe('and the API fails to load', () => {
    beforeEach(async () => {
      jest.mocked(loadYouTubeApi).mockRejectedValue(new Error('offline'))
      await mount()
    })

    it('should render nothing', () => {
      expect(result.container).toBeEmptyDOMElement()
    })

    it('should warn with the player kind only', () => {
      expect(warn).toHaveBeenCalledWith(FAILURE, 'youtube')
    })
  })
})

describe('when a file client video renders', () => {
  let state: PresentationState
  let warn: jest.SpyInstance
  let play: jest.SpyInstance
  let pause: jest.SpyInstance
  let result: RenderResult
  let video: SlideVideoInfo

  const element = () => result.container.querySelector('video') as HTMLVideoElement
  const mount = (muted = false) => {
    result = render(<ClientVideo video={video} muted={muted} />)
  }
  const canPlay = async (readyState: number = HTMLMediaElement.HAVE_ENOUGH_DATA) => {
    Object.defineProperty(element(), 'readyState', { configurable: true, value: readyState })
    fireEvent.canPlay(element())
    await flush()
  }
  const refusal = (name: string) => new DOMException('refused', name)

  beforeEach(() => {
    jest.useFakeTimers({ now: NOW })
    state = { videoState: 'playing', videoPositionMs: 10_000, videoPositionAt: NOW } as PresentationState
    video = { url: DRIVE_URL, geometry: GEOMETRY, source: 'client' }
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    play = jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    pause = jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
    jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined)
    jest.mocked(usePresentation).mockImplementation(() => ({ state }) as never)
  })

  afterEach(() => {
    cleanup()
    jest.useRealTimers()
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  describe('and it is a Drive file', () => {
    beforeEach(() => mount())

    it('should render a video element with the Drive relay source of the presenter server', () => {
      expect(element()).toHaveAttribute('src', DRIVE_SRC)
    })

    it('should play inline', () => {
      expect(element()).toHaveAttribute('playsinline')
    })
  })

  describe('and it can play 10 s into a playing video', () => {
    beforeEach(async () => {
      mount()
      await canPlay()
    })

    it('should seek the element to the live position', () => {
      expect(element().currentTime).toBe(10)
    })

    it('should play the element', () => {
      expect(play).toHaveBeenCalled()
    })

    describe('and the video ends locally', () => {
      beforeEach(() => {
        fireEvent.ended(element())
        play.mockClear()
        act(() => {
          jest.advanceTimersByTime(5000)
        })
      })

      it('should not play again', () => {
        expect(play).not.toHaveBeenCalled()
      })

      describe('and the presenter restarts the video afterwards', () => {
        beforeEach(() => {
          state = { ...state, videoPositionMs: 3_000, videoPositionAt: NOW }
          result.rerender(<ClientVideo video={video} muted={false} />)
        })

        it('should play again', () => {
          expect(play).toHaveBeenCalled()
        })
      })
    })

    describe('and it unmounts', () => {
      beforeEach(() => {
        pause.mockClear()
        result.unmount()
      })

      it('should pause the element', () => {
        expect(pause).toHaveBeenCalled()
      })
    })
  })

  describe('and it can play without enough data buffered', () => {
    beforeEach(async () => {
      mount()
      await canPlay(HTMLMediaElement.HAVE_CURRENT_DATA)
    })

    it('should not seek', () => {
      expect(element().currentTime).toBe(0)
    })
  })

  describe('and it can play while the video is paused', () => {
    beforeEach(async () => {
      state = { ...state, videoState: 'paused' }
      mount()
      await canPlay()
    })

    it('should pause the element', () => {
      expect(pause).toHaveBeenCalled()
    })
  })

  describe('and the tab is muted', () => {
    beforeEach(async () => {
      mount(true)
      await canPlay()
    })

    it('should mute the element', () => {
      expect(element().muted).toBe(true)
    })
  })

  describe('and the browser refuses unmuted autoplay', () => {
    beforeEach(async () => {
      play.mockRejectedValueOnce(refusal('NotAllowedError'))
      mount()
      await canPlay()
    })

    it('should show the unmute button', () => {
      expect(screen.getByRole('button', UNMUTE)).toBeInTheDocument()
    })

    it('should play the element muted', () => {
      expect(element().muted).toBe(true)
    })

    describe('and the viewer clicks the unmute button', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByRole('button', UNMUTE))
      })

      it('should unmute the element', () => {
        expect(element().muted).toBe(false)
      })
    })
  })

  describe('and the presenter pauses before the browser refuses unmuted autoplay', () => {
    let refuse: (error: unknown) => void

    beforeEach(async () => {
      play.mockReturnValueOnce(new Promise<void>((_, reject) => (refuse = reject)))
      mount()
      await canPlay()
      state = { ...state, videoState: 'paused' }
      result.rerender(<ClientVideo video={video} muted={false} />)
      play.mockClear()
      refuse(refusal('NotAllowedError'))
      await flush()
    })

    it('should show the unmute button', () => {
      expect(screen.getByRole('button', UNMUTE)).toBeInTheDocument()
    })

    it('should not play the element', () => {
      expect(play).not.toHaveBeenCalled()
    })
  })

  describe('and the browser refuses the muted retry too', () => {
    beforeEach(async () => {
      play.mockRejectedValueOnce(refusal('NotAllowedError')).mockRejectedValueOnce(refusal('NotAllowedError'))
      mount()
      await canPlay()
    })

    it('should keep the video element', () => {
      expect(element()).toBeInTheDocument()
    })

    it('should keep the unmute button', () => {
      expect(screen.getByRole('button', UNMUTE)).toBeInTheDocument()
    })

    it('should not warn', () => {
      expect(warn).not.toHaveBeenCalled()
    })
  })

  describe('and play is aborted', () => {
    beforeEach(async () => {
      play.mockRejectedValueOnce(refusal('AbortError'))
      mount()
      await canPlay()
    })

    it('should keep the video element', () => {
      expect(element()).toBeInTheDocument()
    })

    it('should not show the unmute button', () => {
      expect(screen.queryByRole('button', UNMUTE)).not.toBeInTheDocument()
    })

    it('should not warn', () => {
      expect(warn).not.toHaveBeenCalled()
    })
  })

  describe('and play fails because the source is not supported', () => {
    beforeEach(async () => {
      play.mockRejectedValueOnce(refusal('NotSupportedError'))
      mount()
      await canPlay()
    })

    it('should render nothing', () => {
      expect(result.container).toBeEmptyDOMElement()
    })
  })

  describe('and the element reports a media error', () => {
    beforeEach(() => {
      mount()
      fireEvent.error(element())
    })

    it('should render nothing', () => {
      expect(result.container).toBeEmptyDOMElement()
    })
  })
})

describe('when an HLS client video renders', () => {
  let state: PresentationState
  let detach: jest.Mock
  let warn: jest.SpyInstance
  let result: RenderResult
  let video: SlideVideoInfo

  const mount = async () => {
    result = render(<ClientVideo video={video} muted={false} />)
    await flush()
  }

  beforeEach(() => {
    state = { videoState: 'playing', videoPositionMs: 0, videoPositionAt: Date.now() } as PresentationState
    video = { url: VIMEO_URL, geometry: GEOMETRY, source: 'client' }
    detach = jest.fn()
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
    jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined)
    jest.mocked(usePresentation).mockImplementation(() => ({ state }) as never)
    jest.mocked(attachHls).mockResolvedValue(detach)
  })

  afterEach(() => {
    cleanup()
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  describe('and the stream attaches', () => {
    beforeEach(() => mount())

    it('should attach the canonical URL to the video element', () => {
      expect(attachHls).toHaveBeenCalledWith(result.container.querySelector('video'), VIMEO_URL, expect.any(Function))
    })

    describe('and it unmounts', () => {
      beforeEach(() => {
        result.unmount()
      })

      it('should run the HLS cleanup', () => {
        expect(detach).toHaveBeenCalled()
      })
    })
  })

  describe('and it unmounts before the stream attaches', () => {
    let resolve: (cleanup: () => void) => void

    beforeEach(async () => {
      jest.mocked(attachHls).mockReturnValue(new Promise(done => (resolve = done)))
      result = render(<ClientVideo video={video} muted={false} />)
      result.unmount()
      resolve(detach)
      await flush()
    })

    it('should run the HLS cleanup once it attaches', () => {
      expect(detach).toHaveBeenCalled()
    })
  })

  describe('and hls.js reports a fatal error', () => {
    beforeEach(async () => {
      await mount()
      act(() => jest.mocked(attachHls).mock.calls[0][2]())
    })

    it('should render nothing', () => {
      expect(result.container).toBeEmptyDOMElement()
    })

    it('should run the HLS cleanup', () => {
      expect(detach).toHaveBeenCalled()
    })

    it('should warn with the player kind only', () => {
      expect(warn).toHaveBeenCalledWith(FAILURE, 'hls')
    })
  })

  describe('and attaching fails', () => {
    beforeEach(async () => {
      jest.mocked(attachHls).mockRejectedValue(new Error('HLS is not supported'))
      await mount()
    })

    it('should render nothing', () => {
      expect(result.container).toBeEmptyDOMElement()
    })

    it('should warn with the player kind only', () => {
      expect(warn).toHaveBeenCalledWith(FAILURE, 'hls')
    })
  })
})

describe('when a client video URL is not canonical', () => {
  let result: RenderResult

  beforeEach(() => {
    jest.mocked(usePresentation).mockImplementation(() => ({ state: { videoState: 'playing' } }) as never)
    result = render(<ClientVideo video={{ url: 'https://example.com/video.mp4', geometry: GEOMETRY, source: 'client' }} muted={false} />)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render nothing', () => {
    expect(result.container).toBeEmptyDOMElement()
  })

  it('should not load a player', () => {
    expect(loadYouTubeApi).not.toHaveBeenCalled()
  })
})
