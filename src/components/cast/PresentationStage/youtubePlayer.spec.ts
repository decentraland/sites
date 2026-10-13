import { fireEvent } from '@testing-library/react'
import type { ClientPlayerEvents, ClientPlayerHandle, YouTubePlayer, YouTubePlayerOptions } from './PresentationStage.types'

const API_SRC = 'https://www.youtube.com/iframe_api'
const VIDEO_ID = 'dQw4w9WgXcQ'

const apiScripts = () => document.querySelectorAll(`script[src="${API_SRC}"]`)

describe('when the YouTube IFrame API is loaded', () => {
  let loadYouTubeApi: () => Promise<void>

  beforeEach(async () => {
    jest.resetModules()
    ;({ loadYouTubeApi } = await import('./youtubePlayer'))
  })

  afterEach(() => {
    apiScripts().forEach(script => script.remove())
    delete window.onYouTubeIframeAPIReady
    jest.resetAllMocks()
  })

  describe('and two callers load it concurrently', () => {
    let first: Promise<void>
    let second: Promise<void>

    beforeEach(() => {
      first = loadYouTubeApi()
      second = loadYouTubeApi()
    })

    it('should add a single script tag', () => {
      expect(apiScripts()).toHaveLength(1)
    })

    it('should share one promise', () => {
      expect(first).toBe(second)
    })

    it('should add no integrity attribute', () => {
      expect(apiScripts()[0]).not.toHaveAttribute('integrity')
    })

    describe('and the API signals it is ready', () => {
      beforeEach(() => {
        window.onYouTubeIframeAPIReady?.()
      })

      it('should resolve', async () => {
        await expect(first).resolves.toBeUndefined()
      })
    })
  })

  describe('and the script fails to load', () => {
    let failed: Promise<void>
    let retried: Promise<void>

    beforeEach(() => {
      failed = loadYouTubeApi()
      failed.catch(() => undefined)
      fireEvent.error(apiScripts()[0])
      retried = loadYouTubeApi()
    })

    it('should reject', async () => {
      await expect(failed).rejects.toThrow('YouTube IFrame API failed to load')
    })

    it('should start a new load on the next call', () => {
      expect(retried).not.toBe(failed)
    })
  })

  describe('and the API is already on the page', () => {
    let loaded: Promise<void>

    beforeEach(() => {
      window.YT = { Player: jest.fn() }
      loaded = loadYouTubeApi()
    })

    afterEach(() => {
      delete window.YT
    })

    it('should resolve', async () => {
      await expect(loaded).resolves.toBeUndefined()
    })

    it('should add no script tag', () => {
      expect(apiScripts()).toHaveLength(0)
    })
  })

  describe('and the page already has a ready callback', () => {
    let previous: jest.Mock
    let loaded: Promise<void>

    beforeEach(() => {
      previous = jest.fn()
      window.onYouTubeIframeAPIReady = previous
      loaded = loadYouTubeApi()
      window.onYouTubeIframeAPIReady?.()
    })

    it('should still call the earlier callback', () => {
      expect(previous).toHaveBeenCalled()
    })

    it('should resolve', async () => {
      await expect(loaded).resolves.toBeUndefined()
    })
  })
})

describe('when a YouTube player is created', () => {
  let createYouTubePlayer: (container: HTMLElement, id: string, events: ClientPlayerEvents) => ClientPlayerHandle
  let player: jest.Mocked<YouTubePlayer>
  let Player: jest.Mock
  let container: HTMLDivElement
  let handedParent: HTMLElement | null
  let events: jest.Mocked<ClientPlayerEvents>
  let handle: ClientPlayerHandle

  const options = () => Player.mock.calls[0][1] as YouTubePlayerOptions

  beforeEach(async () => {
    jest.resetModules()
    ;({ createYouTubePlayer } = await import('./youtubePlayer'))
    player = {
      playVideo: jest.fn(),
      pauseVideo: jest.fn(),
      seekTo: jest.fn(),
      getCurrentTime: jest.fn().mockReturnValue(12.5),
      getDuration: jest.fn().mockReturnValue(0),
      getPlayerState: jest.fn().mockReturnValue(-1),
      mute: jest.fn(),
      unMute: jest.fn(),
      setOption: jest.fn(),
      destroy: jest.fn()
    }
    Player = jest.fn().mockImplementation((element: HTMLElement) => {
      const iframe = document.createElement('iframe')
      handedParent = element.parentElement
      element.replaceWith(iframe)
      player.destroy.mockImplementation(() => iframe.replaceWith(element))
      return player
    })
    window.YT = { Player }
    container = document.createElement('div')
    document.body.append(container)
    events = { onReady: jest.fn(), onEnded: jest.fn(), onError: jest.fn(), onAutoplayBlocked: jest.fn() }
    handle = createYouTubePlayer(container, VIDEO_ID, events)
  })

  afterEach(() => {
    container.remove()
    delete window.YT
    jest.resetAllMocks()
  })

  it('should hand YT.Player a child it created inside the container', () => {
    expect(handedParent).toBe(container)
  })

  it('should never hand YT.Player the container itself', () => {
    expect(Player.mock.calls[0][0]).not.toBe(container)
  })

  it('should load the parsed id without controls, keyboard, related videos, fullscreen, annotations or captions', () => {
    expect(options()).toEqual(
      expect.objectContaining({
        videoId: VIDEO_ID,
        playerVars: {
          controls: 0,
          disablekb: 1,
          playsinline: 1,
          rel: 0,
          fs: 0,
          iv_load_policy: 3,
          cc_load_policy: 0,
          origin: window.location.origin
        }
      })
    )
  })

  describe('and the player loads a module', () => {
    beforeEach(() => {
      options().events.onApiChange()
    })

    it('should clear the captions track', () => {
      expect(player.setOption).toHaveBeenCalledWith('captions', 'track', {})
    })
  })

  it('should size the player to fill its region', () => {
    expect(options()).toEqual(expect.objectContaining({ width: '100%', height: '100%' }))
  })

  describe.each([
    ['ready', () => options().events.onReady(), 'onReady'],
    ['ended', () => options().events.onStateChange({ data: 0 }), 'onEnded'],
    ['an error', () => options().events.onError(), 'onError'],
    ['a blocked autoplay', () => options().events.onAutoplayBlocked(), 'onAutoplayBlocked']
  ] as const)('and the player reports %s', (_, emit, callback) => {
    beforeEach(() => {
      emit()
    })

    it(`should call ${callback}`, () => {
      expect(events[callback]).toHaveBeenCalled()
    })
  })

  describe.each([
    ['unmuted', false],
    ['muted', true]
  ])('and autoplay is blocked for an attempt made while %s', (_, muted) => {
    beforeEach(() => {
      handle.setMuted(muted)
      handle.play()
      handle.setMuted(!muted)
      options().events.onAutoplayBlocked()
    })

    it('should report the refusal without attributing it to the attempt', () => {
      expect(events.onAutoplayBlocked).toHaveBeenCalledWith()
    })
  })

  describe('and play is requested before the player answers', () => {
    beforeEach(() => {
      handle.play()
    })

    it('should report it as playing', () => {
      expect(handle.isPlaying()).toBe(true)
    })

    describe.each([
      ['the player reports it paused', () => options().events.onStateChange({ data: 2 })],
      ['autoplay is blocked', () => options().events.onAutoplayBlocked()],
      ['pause is requested', () => handle.pause()]
    ])('and %s', (_, settle) => {
      beforeEach(() => {
        settle()
      })

      it('should no longer report it as playing', () => {
        expect(handle.isPlaying()).toBe(false)
      })
    })

    describe('and the player reports it buffering', () => {
      beforeEach(() => {
        options().events.onStateChange({ data: 3 })
      })

      it('should still report it as playing', () => {
        expect(handle.isPlaying()).toBe(true)
      })
    })
  })

  describe('and the player starts playing', () => {
    beforeEach(() => {
      options().events.onStateChange({ data: 1 })
    })

    it('should not report it ended', () => {
      expect(events.onEnded).not.toHaveBeenCalled()
    })
  })

  describe.each([
    ['play', () => handle.play(), () => player.playVideo, []],
    ['pause', () => handle.pause(), () => player.pauseVideo, []],
    ['seekTo', () => handle.seekTo(1500), () => player.seekTo, [1.5, true]],
    ['setMuted(true)', () => handle.setMuted(true), () => player.mute, []],
    ['setMuted(false)', () => handle.setMuted(false), () => player.unMute, []]
  ])('and %s is called', (_, call, target, args) => {
    beforeEach(() => {
      call()
    })

    it('should delegate to the player', () => {
      expect(target()).toHaveBeenCalledWith(...args)
    })
  })

  describe.each([
    ['currentTimeMs', () => undefined, () => handle.currentTimeMs(), 12500],
    ['durationMs before the duration is known', () => undefined, () => handle.durationMs(), null],
    ['durationMs once the duration is known', () => player.getDuration.mockReturnValue(90), () => handle.durationMs(), 90000],
    ['isPlaying while playing', () => player.getPlayerState.mockReturnValue(1), () => handle.isPlaying(), true],
    ['isPlaying while paused', () => player.getPlayerState.mockReturnValue(2), () => handle.isPlaying(), false],
    ['isBusy while buffering', () => player.getPlayerState.mockReturnValue(3), () => handle.isBusy(), true],
    ['isBusy while playing', () => player.getPlayerState.mockReturnValue(1), () => handle.isBusy(), false]
  ])('and %s is read', (_, arrange, read, expected) => {
    let value: unknown

    beforeEach(() => {
      arrange()
      value = read()
    })

    it(`should return ${String(expected)}`, () => {
      expect(value).toBe(expected)
    })
  })

  describe('and it is destroyed', () => {
    beforeEach(() => {
      handle.destroy()
    })

    it('should destroy the player', () => {
      expect(player.destroy).toHaveBeenCalled()
    })

    it('should remove the child it created', () => {
      expect(container).toBeEmptyDOMElement()
    })
  })
})

describe('when a YouTube player is created before the API has loaded', () => {
  let createYouTubePlayer: (container: HTMLElement, id: string, events: ClientPlayerEvents) => ClientPlayerHandle
  let events: ClientPlayerEvents

  beforeEach(async () => {
    jest.resetModules()
    ;({ createYouTubePlayer } = await import('./youtubePlayer'))
    events = { onReady: jest.fn(), onEnded: jest.fn(), onError: jest.fn(), onAutoplayBlocked: jest.fn() }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should throw', () => {
    expect(() => createYouTubePlayer(document.createElement('div'), VIDEO_ID, events)).toThrow('YouTube IFrame API is not loaded')
  })
})
