import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { LiveKitCredentials } from '../../../features/cast2/cast2.types'
import { SegmentEvent } from '../../../modules/segment.types'
// Import through the barrel so the re-export contract is exercised too.
import { SceneChatDock, SceneRoomMount, SceneWatcherCard } from '.'

const mockUseTracks = jest.fn()
const mockUseAdvancedUserAgentData = jest.fn()
const mockTrack = jest.fn()
const mockJumpIn = jest.fn()
jest.mock('../DiscoverJumpInProvider', () => ({
  useDiscoverJumpIn: () => ({ jumpIn: mockJumpIn })
}))
// Minimal place stand-in — the launcher only receives it and its surface tag.
const mockPlace = { id: 'scene-1', base_position: '-9,-9' } as never
const mockChatContext = {
  chatMessages: [] as unknown[],
  markMessagesAsRead: jest.fn(),
  setChatOpen: jest.fn()
}

jest.mock('@livekit/components-react', () => ({
  LiveKitRoom: ({ children }: { children?: React.ReactNode }) => <div data-testid="livekit-room">{children}</div>,
  RoomAudioRenderer: () => null,
  ConnectionStateToast: () => null,
  useTracks: () => mockUseTracks(),
  useRemoteParticipants: () => []
}))
jest.mock('@livekit/components-styles', () => ({}))
jest.mock('livekit-client', () => ({
  Track: { Source: { Camera: 'camera', ScreenShare: 'screen_share' } }
}))

jest.mock('../../../features/cast2/contexts/ChatProvider', () => ({
  ChatProvider: ({ children }: { children?: React.ReactNode }) => <div data-testid="chat-provider">{children}</div>,
  useChatContext: () => mockChatContext
}))
jest.mock('../../../features/cast2/contexts/LiveKitContext', () => ({
  LiveKitProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  useLiveKitCredentials: () => ({ streamMetadata: undefined })
}))

jest.mock('../../../features/discover/sceneAdapter', () => ({
  getLivePeerUrl: () => 'https://peer.test'
}))

// `config/env` reads `import.meta` (Jest can't parse it) through the
// cast2 peer module that PeopleStack's profile lookups depend on.
jest.mock('../../../config/env', () => ({
  getEnv: () => undefined
}))
jest.mock('../../../hooks/useProfiles', () => ({
  useProfiles: () => ({ profiles: new Map() })
}))

// The ready-state video surfaces mount LiveKit track grids — heavy and
// irrelevant to the watcher chrome under test.
jest.mock('./SceneRoomContent', () => ({
  SceneRoomContent: () => <div data-testid="scene-room-content" />
}))
jest.mock('../../cast/WatcherView/WatcherViewContent', () => ({
  WatcherViewContent: () => <div data-testid="watcher-view-content" />
}))

jest.mock('@dcl/hooks', () => ({
  useAdvancedUserAgentData: () => mockUseAdvancedUserAgentData()
}))

jest.mock('../../../hooks/useDeferredTrack', () => ({
  useDeferredTrack: () => mockTrack
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id?: string | null) => id ?? ''
}))

// Run the real *.styled.ts files (watcher + ChatPanel) through the shared
// styled shim instead of the emotion engine (decentraland-ui2 ships ESM Jest
// can't transform).
jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  return {
    ...actual,
    Typography: actual.Box,
    Paper: actual.Box,
    Input: actual.Box,
    Button: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => (
      <button type="button" onClick={onClick}>
        {children}
      </button>
    ),
    CircularProgress: () => <div role="progressbar" />,
    Popover: () => null,
    dclColors: {
      base: { primary: '#ff2d55', primaryDark1: '#e6284c' },
      neutral: {
        softWhite: '#fcfcfc',
        gray1: '#43404a',
        gray3: '#a09ba8',
        gray4: '#cfcdd4',
        gray5: '#ecebed',
        softBlack1: '#161518',
        softBlack2: '#242129',
        trueWhite: '#ffffff',
        white: '#ffffff'
      },
      blackTransparent: { backdrop: 'rgba(0,0,0,0.6)', blurry: 'rgba(0,0,0,0.4)' },
      whiteTransparent: { blurry: 'rgba(255,255,255,0.2)', subtle: 'rgba(255,255,255,0.1)' }
    }
  }
})

const credentials: LiveKitCredentials = { url: 'wss://livekit.test', token: 'jwt', identity: 'guest', roomId: '' }

describe('SceneLiveWatcher', () => {
  beforeEach(() => {
    mockUseTracks.mockReturnValue([])
    mockUseAdvancedUserAgentData.mockReturnValue([false, { mobile: false }])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('SceneRoomMount', () => {
    describe('when no credentials are available', () => {
      it('should render the children without any LiveKit wrapper', () => {
        render(
          <SceneRoomMount credentials={null}>
            <span>bare child</span>
          </SceneRoomMount>
        )

        expect(screen.getByText('bare child')).toBeInTheDocument()
        expect(screen.queryByTestId('livekit-room')).not.toBeInTheDocument()
      })
    })

    describe('when credentials resolve', () => {
      it('should wrap the children in the LiveKit room and the chat provider', () => {
        render(
          <SceneRoomMount credentials={credentials}>
            <span>roomed child</span>
          </SceneRoomMount>
        )

        expect(screen.getByTestId('livekit-room')).toBeInTheDocument()
        expect(screen.getByTestId('chat-provider')).toBeInTheDocument()
        expect(screen.getByText('roomed child')).toBeInTheDocument()
      })
    })
  })

  describe('SceneWatcherCard', () => {
    describe('when the room is still loading', () => {
      it('should render the connecting placeholder with a spinner', () => {
        render(<SceneWatcherCard status="loading" mode="scene" />)

        expect(screen.getByRole('progressbar')).toBeInTheDocument()
        expect(screen.getByText('discover.scene.connecting')).toBeInTheDocument()
      })

      it('should keep a disabled fullscreen placeholder so the card height matches the running state', () => {
        render(<SceneWatcherCard status="loading" mode="scene" />)

        expect(screen.getByRole('button', { name: 'discover.scene.fullscreen' })).toBeDisabled()
        expect(screen.queryByRole('button', { name: 'discover.scene.explore_scene' })).not.toBeInTheDocument()
      })

      it('should offer a live JUMP IN while connecting when the deep link is known', () => {
        render(<SceneWatcherCard status="loading" mode="scene" place={mockPlace} />)

        fireEvent.click(screen.getByRole('button', { name: /discover\.card\.jump_in/ }))

        expect(mockJumpIn).toHaveBeenCalledWith(mockPlace, 'scene-preview')
      })
    })

    describe('when nobody is broadcasting (scene-only watcher)', () => {
      const props = {
        status: 'no-broadcast' as const,
        mode: 'scene' as const,
        streamingHref: 'https://decentraland.zone/bevy-web/?position=-9%2C-9',
        coverImage: 'https://img.test/cover.png',
        place: mockPlace
      }

      it('should auto-boot the credentialless bevy iframe with no EXPLORE gate on desktop', () => {
        render(<SceneWatcherCard {...props} />)

        const iframe = screen.getByTitle('discover.scene.tab_streaming')
        expect(iframe).toHaveAttribute('src', props.streamingHref)
        expect(iframe.hasAttribute('credentialless')).toBe(true)
        expect(screen.queryByRole('button', { name: 'discover.scene.explore_scene' })).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'discover.scene.close_media' })).toBeInTheDocument()
      })

      it('should track the auto-launch with the streaming href', () => {
        render(<SceneWatcherCard {...props} />)

        expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.DISCOVER_LAUNCH_SCENE, { href: props.streamingHref, auto: true })
      })

      it('should unmount the iframe on STOP and bring EXPLORE back as the re-open path', () => {
        render(<SceneWatcherCard {...props} />)

        fireEvent.click(screen.getByRole('button', { name: 'discover.scene.close_media' }))

        expect(screen.queryByTitle('discover.scene.tab_streaming')).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'discover.scene.fullscreen' })).not.toBeInTheDocument()

        // The auto-launch doesn't fight the explicit close — the preview only
        // comes back through the EXPLORE CTA, tracked as a manual launch.
        fireEvent.click(screen.getByRole('button', { name: 'discover.scene.explore_scene' }))
        expect(screen.getByTitle('discover.scene.tab_streaming')).toBeInTheDocument()
        expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.DISCOVER_LAUNCH_SCENE, { href: props.streamingHref })
      })

      it('should keep a floating JUMP IN card over the running preview and deep-link on click', () => {
        render(<SceneWatcherCard {...props} />)

        // Button-only float card — no "Jump In to participate!" title.
        expect(screen.queryByText('discover.scene.participate_title')).not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: /discover\.card\.jump_in/ }))

        expect(mockJumpIn).toHaveBeenCalledWith(mockPlace, 'scene-preview')
      })

      it('should toggle fullscreen on the video area through the browser API', () => {
        const requestFullscreen = jest.fn().mockResolvedValue(undefined)
        const exitFullscreen = jest.fn().mockResolvedValue(undefined)
        Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { configurable: true, value: requestFullscreen })
        Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exitFullscreen })
        // The element the toggle called requestFullscreen on (jest records the
        // receiver in mock.contexts) becomes the "browser" fullscreen element.
        Object.defineProperty(document, 'fullscreenElement', {
          configurable: true,
          get: () => (requestFullscreen.mock.contexts[0] as Element | undefined) ?? null
        })
        render(<SceneWatcherCard {...props} />)

        // FULLSCREEN is live right away — the preview auto-boots on desktop.
        fireEvent.click(screen.getByRole('button', { name: 'discover.scene.fullscreen' }))
        expect(requestFullscreen).toHaveBeenCalledTimes(1)

        // Browser confirms — the control flips to EXIT and a second click
        // leaves fullscreen through document.exitFullscreen.
        fireEvent(document, new Event('fullscreenchange'))
        fireEvent.click(screen.getByRole('button', { name: 'discover.scene.exit_fullscreen' }))
        expect(exitFullscreen).toHaveBeenCalledTimes(1)
      })

      it('should swallow fullscreen API rejections without crashing the watcher', async () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        const requestFullscreen = jest.fn().mockRejectedValue(new Error('fullscreen denied'))
        const exitFullscreen = jest.fn().mockRejectedValue(new Error('not active'))
        Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { configurable: true, value: requestFullscreen })
        Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exitFullscreen })
        Object.defineProperty(document, 'fullscreenElement', {
          configurable: true,
          get: () => (requestFullscreen.mock.contexts[0] as Element | undefined) ?? null
        })
        render(<SceneWatcherCard {...props} />)

        fireEvent.click(screen.getByRole('button', { name: 'discover.scene.fullscreen' }))
        await waitFor(() => expect(warnSpy).toHaveBeenCalledWith('[SceneLiveWatcher] fullscreen rejected', expect.any(Error)))

        // Pretend the browser entered fullscreen anyway so the next click
        // walks the exitFullscreen rejection path.
        fireEvent(document, new Event('fullscreenchange'))
        expect(() => fireEvent.click(screen.getByRole('button', { name: 'discover.scene.exit_fullscreen' }))).not.toThrow()
        expect(exitFullscreen).toHaveBeenCalledTimes(1)

        warnSpy.mockRestore()
      })

      describe('and no streaming href could be resolved', () => {
        it('should disable the launch CTA and render no fullscreen control', () => {
          render(<SceneWatcherCard {...props} streamingHref={null} />)

          expect(screen.getByRole('button', { name: 'discover.scene.explore_scene' })).toBeDisabled()
          expect(screen.queryByRole('button', { name: 'discover.scene.fullscreen' })).not.toBeInTheDocument()
        })
      })

      describe('and the visitor is on a touch device', () => {
        beforeEach(() => {
          mockUseAdvancedUserAgentData.mockReturnValue([false, { mobile: true }])
        })

        it('should render the store card instead of the launch CTAs', () => {
          render(<SceneWatcherCard {...props} />)

          expect(screen.getByText('discover.scene.mobile_unsupported.title')).toBeInTheDocument()
          expect(screen.queryByRole('button', { name: 'discover.scene.explore_scene' })).not.toBeInTheDocument()
        })

        it('should link to the App Store when the device is not Android', () => {
          render(<SceneWatcherCard {...props} />)

          const link = screen.getByRole('link')
          expect(link.getAttribute('href')).toContain('apps.apple.com')
        })
      })
    })

    describe('when the room is ready without any live video', () => {
      const props = {
        status: 'ready' as const,
        mode: 'scene' as const,
        streamingHref: 'https://decentraland.zone/bevy-web/?position=-9%2C-9',
        place: mockPlace,
        initialUserCount: 5
      }

      it('should render tabless with the bevy iframe auto-booted (Figma viewer card has no tabs)', () => {
        render(<SceneWatcherCard {...props} />)

        expect(screen.queryByRole('button', { name: 'discover.scene.tab_video' })).not.toBeInTheDocument()
        expect(screen.getByTitle('discover.scene.tab_streaming')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'discover.scene.explore_scene' })).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'discover.scene.close_media' })).toBeInTheDocument()
      })

      it('should unmount the iframe on STOP and bring EXPLORE back as the re-open path', () => {
        render(<SceneWatcherCard {...props} />)

        fireEvent.click(screen.getByRole('button', { name: 'discover.scene.close_media' }))

        expect(screen.queryByTitle('discover.scene.tab_streaming')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'discover.scene.explore_scene' })).toBeInTheDocument()
      })
    })

    describe('when the room is ready with a live video broadcast', () => {
      const props = {
        status: 'ready' as const,
        mode: 'scene' as const,
        streamingHref: 'https://decentraland.zone/bevy-web/?position=-9%2C-9',
        place: mockPlace
      }

      beforeEach(() => {
        mockUseTracks.mockReturnValue([{ publication: { isMuted: false } }])
      })

      it('should surface the VIDEO / SCENE WEB tab strip and start on the video tab', () => {
        render(<SceneWatcherCard {...props} />)

        expect(screen.getByRole('button', { name: 'discover.scene.tab_video' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'discover.scene.tab_streaming' })).toBeInTheDocument()
        expect(screen.getByTestId('scene-room-content')).toBeInTheDocument()
      })

      it('should render the cast watcher surface when the room mode is cast', () => {
        render(<SceneWatcherCard {...props} mode="cast" />)

        expect(screen.getByTestId('watcher-view-content')).toBeInTheDocument()
      })

      it('should pause the video on STOP and offer a resume CTA', () => {
        render(<SceneWatcherCard {...props} />)

        fireEvent.click(screen.getByRole('button', { name: 'discover.scene.close_media' }))

        expect(screen.queryByTestId('scene-room-content')).not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'discover.scene.resume_cta' }))
        expect(screen.getByTestId('scene-room-content')).toBeInTheDocument()
      })

      it('should keep bevy cold while on the video tab and auto-boot it on switching to the scene tab', () => {
        render(<SceneWatcherCard {...props} />)
        expect(screen.queryByTitle('discover.scene.tab_streaming')).not.toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'discover.scene.tab_streaming' }))

        expect(screen.queryByTestId('scene-room-content')).not.toBeInTheDocument()
        expect(screen.getByTitle('discover.scene.tab_streaming')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'discover.scene.explore_scene' })).not.toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'discover.scene.tab_video' }))
        expect(screen.getByTestId('scene-room-content')).toBeInTheDocument()
      })

      it('should unmount the bevy iframe when STOP is pressed on the scene tab', () => {
        render(<SceneWatcherCard {...props} />)
        fireEvent.click(screen.getByRole('button', { name: 'discover.scene.tab_streaming' }))
        expect(screen.getByTitle('discover.scene.tab_streaming')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'discover.scene.close_media' }))

        expect(screen.queryByTitle('discover.scene.tab_streaming')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'discover.scene.explore_scene' })).toBeInTheDocument()
      })

      it('should fall back to the scene tab and auto-boot bevy when the broadcast ends while watching video', () => {
        const { rerender } = render(<SceneWatcherCard {...props} />)
        expect(screen.getByTestId('scene-room-content')).toBeInTheDocument()

        mockUseTracks.mockReturnValue([])
        rerender(<SceneWatcherCard {...props} />)

        expect(screen.queryByTestId('scene-room-content')).not.toBeInTheDocument()
        expect(screen.getByTitle('discover.scene.tab_streaming')).toBeInTheDocument()
      })
    })
  })

  describe('SceneChatDock', () => {
    describe('when the room is not ready yet', () => {
      it('should render the chat shell with the In-World Chat header and the empty state', () => {
        render(<SceneChatDock status="loading" sceneName="Genesis Plaza" jumpHref="decentraland://?position=-9%2C-9" />)

        expect(screen.getByText('page.cast.chat.title')).toBeInTheDocument()
        expect(screen.getByText('page.cast.chat.no_messages_yet')).toBeInTheDocument()
      })

      it('should render the jump-in footer with the scene name as a deep link', () => {
        render(<SceneChatDock status="loading" sceneName="Genesis Plaza" jumpHref="decentraland://?position=-9%2C-9" />)

        const link = screen.getByRole('link', { name: 'Genesis Plaza' })
        expect(link).toHaveAttribute('href', 'decentraland://?position=-9%2C-9')
        expect(screen.getByText(/page\.cast\.chat\.footer_jump_prefix/)).toBeInTheDocument()
      })

      it('should fall back to the plain footer when there is no deep link', () => {
        render(<SceneChatDock status="no-broadcast" sceneName="Genesis Plaza" />)

        expect(screen.queryByRole('link')).not.toBeInTheDocument()
        expect(screen.getByText('page.cast.chat.footer_text')).toBeInTheDocument()
      })

      it('should say the chat is unavailable when the room could not be joined', () => {
        render(<SceneChatDock status="no-broadcast" sceneName="Genesis Plaza" />)

        expect(screen.getByText('page.cast.chat.unavailable')).toBeInTheDocument()
        expect(screen.queryByText('page.cast.chat.no_messages_yet')).not.toBeInTheDocument()
      })
    })

    describe('when the room is ready', () => {
      it('should mount the live chat and mark it open for the unread counters', () => {
        render(<SceneChatDock status="ready" sceneName="Genesis Plaza" jumpHref="decentraland://?position=-9%2C-9" />)

        expect(mockChatContext.setChatOpen).toHaveBeenCalledWith(true)
      })

      it('should mark the chat closed again on unmount', () => {
        const { unmount } = render(<SceneChatDock status="ready" sceneName="Genesis Plaza" />)

        unmount()

        expect(mockChatContext.setChatOpen).toHaveBeenLastCalledWith(false)
      })
    })
  })
})
