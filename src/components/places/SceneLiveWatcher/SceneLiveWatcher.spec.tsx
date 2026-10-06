import type { ComponentProps } from 'react'
import { type RenderResult, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { LiveKitCredentials } from '../../../features/cast2/cast2.types'
import type { DiscoverPlace } from '../../../features/discover'
import { SegmentEvent } from '../../../modules/segment.types'
import { SceneChatDock, SceneRoomMount, SceneWatcherCard } from '.'

const mockUseTracks = jest.fn()
const mockRoomProps = jest.fn()
const mockCaptureLiveKitConnectError = jest.fn()
const mockUseAdvancedUserAgentData = jest.fn()
const mockTrack = jest.fn()
const mockJumpIn = jest.fn()
const mockUseChatContext = jest.fn()
const mockUsePresentationOptional = jest.fn()

jest.mock('../DiscoverJumpInProvider', () => ({
  useDiscoverJumpIn: () => ({ jumpIn: mockJumpIn })
}))
jest.mock('@livekit/components-react', () => ({
  LiveKitRoom: ({ children, ...props }: { children?: React.ReactNode }) => {
    mockRoomProps(props)
    return <div data-testid="livekit-room">{children}</div>
  },
  RoomAudioRenderer: () => null,
  ConnectionStateToast: () => null,
  useTracks: () => mockUseTracks(),
  useRemoteParticipants: () => []
}))
jest.mock('@livekit/components-styles', () => ({}))
jest.mock('../../../modules/liveKitSentry', () => ({
  captureLiveKitConnectError: (...args: unknown[]) => mockCaptureLiveKitConnectError(...args)
}))
jest.mock('livekit-client', () => ({
  Track: { Source: { Camera: 'camera', ScreenShare: 'screen_share' } }
}))
jest.mock('../../../features/cast2/contexts/ChatProvider', () => ({
  ChatProvider: ({ children }: { children?: React.ReactNode }) => <div data-testid="chat-provider">{children}</div>,
  useChatContext: () => mockUseChatContext()
}))
jest.mock('../../../features/cast2/contexts/PresentationContext', () => ({
  PresentationProvider: ({ children }: { children?: React.ReactNode }) => <div data-testid="presentation-provider">{children}</div>,
  usePresentationOptional: () => mockUsePresentationOptional()
}))
jest.mock('../../../features/cast2/contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>
}))
jest.mock('../../../features/cast2/contexts/LiveKitContext', () => ({
  LiveKitProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  useLiveKitCredentials: () => ({ streamMetadata: undefined })
}))
jest.mock('../../../features/discover/sceneAdapter', () => ({
  getLivePeerUrl: () => 'https://peer.test'
}))
jest.mock('../../../config/env', () => ({
  getEnv: () => undefined
}))
jest.mock('../../../hooks/useProfiles', () => ({
  useProfiles: () => ({ profiles: new Map() })
}))
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
jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  return {
    ...actual,
    Typography: actual.Box,
    Button: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => (
      <button type="button" onClick={onClick}>
        {children}
      </button>
    ),
    CircularProgress: () => <div role="progressbar" />,
    dclColors: {
      ...actual.dclColors,
      blackTransparent: { backdrop: 'rgba(0,0,0,0.6)', blurry: 'rgba(0,0,0,0.4)' },
      whiteTransparent: { blurry: 'rgba(255,255,255,0.2)', subtle: 'rgba(255,255,255,0.1)' }
    }
  }
})

const clickButton = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))

describe('SceneLiveWatcher', () => {
  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  describe('when mounting the scene room', () => {
    let credentials: LiveKitCredentials | null

    describe('and no credentials are available', () => {
      beforeEach(() => {
        credentials = null
        render(
          <SceneRoomMount credentials={credentials}>
            <span>bare child</span>
          </SceneRoomMount>
        )
      })

      it('should render the children without any LiveKit wrapper', () => {
        expect(screen.getByText('bare child')).toBeInTheDocument()
        expect(screen.queryByTestId('livekit-room')).not.toBeInTheDocument()
      })
    })

    describe('and credentials resolve', () => {
      beforeEach(() => {
        credentials = { url: 'wss://livekit.test', token: 'jwt', identity: 'guest', roomId: '' }
        render(
          <SceneRoomMount credentials={credentials}>
            <span>roomed child</span>
          </SceneRoomMount>
        )
      })

      it('should wrap the chat provider in the LiveKit room', () => {
        expect(screen.getByTestId('livekit-room')).toContainElement(screen.getByTestId('chat-provider'))
      })

      it('should render the children inside the presentation provider', () => {
        expect(screen.getByTestId('presentation-provider')).toContainElement(screen.getByText('roomed child'))
      })

      describe('and the connection fails', () => {
        let failure: Error

        beforeEach(() => {
          failure = new Error('could not establish signal connection')
          ;(mockRoomProps.mock.calls[0][0] as { onError: (error: Error) => void }).onError(failure)
        })

        it('should report the failure with the surface and the host', () => {
          expect(mockCaptureLiveKitConnectError).toHaveBeenCalledWith(failure, {
            surface: 'scene_watcher',
            serverUrl: 'wss://livekit.test'
          })
        })
      })
    })
  })

  describe('when rendering the watcher card', () => {
    let place: DiscoverPlace
    let props: ComponentProps<typeof SceneWatcherCard>
    let view: RenderResult
    const renderCard = () => {
      view = render(<SceneWatcherCard {...props} />)
    }

    beforeEach(() => {
      place = { id: 'scene-1', base_position: '-9,-9' } as DiscoverPlace
      mockUseAdvancedUserAgentData.mockReturnValue([false, { mobile: false }])
    })

    describe('and the room is still loading', () => {
      beforeEach(() => {
        props = { status: 'loading', mode: 'scene', place }
        renderCard()
      })

      it('should render the connecting placeholder with a spinner', () => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
        expect(screen.getByText('discover.scene.connecting')).toBeInTheDocument()
      })

      it('should keep a disabled launch CTA without a fullscreen control', () => {
        expect(screen.getByRole('button', { name: 'discover.scene.explore_scene' })).toBeDisabled()
        expect(screen.queryByRole('button', { name: 'discover.scene.fullscreen' })).not.toBeInTheDocument()
      })

      describe('and JUMP IN is clicked', () => {
        beforeEach(() => {
          clickButton(/discover\.card\.jump_in/)
        })

        it('should launch the place from the scene preview surface', () => {
          expect(mockJumpIn).toHaveBeenCalledWith(place, 'scene-preview')
        })
      })
    })

    describe('and nobody is broadcasting', () => {
      beforeEach(() => {
        props = {
          status: 'no-broadcast',
          mode: 'scene',
          streamingHref: 'https://decentraland.zone/bevy-web/?position=-9%2C-9',
          coverImage: 'https://img.test/cover.png',
          place
        }
      })

      describe('and a streaming href is resolved', () => {
        beforeEach(() => {
          renderCard()
        })

        it('should show the launch CTA without a fullscreen control or iframe', () => {
          expect(screen.getByRole('button', { name: 'discover.scene.explore_scene' })).toBeEnabled()
          expect(screen.queryByRole('button', { name: 'discover.scene.fullscreen' })).not.toBeInTheDocument()
          expect(screen.queryByTitle('discover.scene.tab_streaming')).not.toBeInTheDocument()
        })

        describe('and EXPLORE THE SCENE is clicked', () => {
          beforeEach(() => {
            clickButton('discover.scene.explore_scene')
          })

          it('should mount the credentialless bevy iframe on the streaming href', () => {
            expect(screen.getByTitle('discover.scene.tab_streaming')).toHaveAttribute('src', props.streamingHref)
            expect(screen.getByTitle('discover.scene.tab_streaming')).toHaveAttribute('credentialless')
          })

          it('should surface the STOP control', () => {
            expect(screen.getByRole('button', { name: 'discover.scene.close_media' })).toBeInTheDocument()
          })

          it('should track the launch intent with the streaming href', () => {
            expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.DISCOVER_LAUNCH_SCENE, { href: props.streamingHref })
          })

          describe('and STOP is clicked', () => {
            beforeEach(() => {
              clickButton('discover.scene.close_media')
            })

            it('should unmount the iframe and restore the launch CTA', () => {
              expect(screen.queryByTitle('discover.scene.tab_streaming')).not.toBeInTheDocument()
              expect(screen.getByRole('button', { name: 'discover.scene.explore_scene' })).toBeInTheDocument()
            })
          })

          describe('and the floating JUMP IN is clicked', () => {
            beforeEach(() => {
              clickButton(/discover\.card\.jump_in/)
            })

            it('should launch the place from the scene preview surface', () => {
              expect(mockJumpIn).toHaveBeenCalledWith(place, 'scene-preview')
            })
          })

          describe('and the fullscreen API is available', () => {
            let requestFullscreen: jest.Mock
            let exitFullscreen: jest.Mock

            beforeEach(() => {
              requestFullscreen = jest.fn()
              exitFullscreen = jest.fn()
              Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { configurable: true, value: requestFullscreen })
              Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exitFullscreen })
              Object.defineProperty(document, 'fullscreenElement', {
                configurable: true,
                get: () => (requestFullscreen.mock.contexts[0] as Element | undefined) ?? null
              })
            })

            describe('and the browser grants fullscreen', () => {
              beforeEach(() => {
                requestFullscreen.mockResolvedValueOnce(undefined)
                clickButton('discover.scene.fullscreen')
              })

              it('should request fullscreen on the video area', () => {
                expect(requestFullscreen).toHaveBeenCalledTimes(1)
              })

              describe('and EXIT FULLSCREEN is clicked once the browser confirms', () => {
                beforeEach(() => {
                  exitFullscreen.mockResolvedValueOnce(undefined)
                  fireEvent(document, new Event('fullscreenchange'))
                  clickButton('discover.scene.exit_fullscreen')
                })

                it('should leave fullscreen through the document', () => {
                  expect(exitFullscreen).toHaveBeenCalledTimes(1)
                })
              })
            })

            describe('and the browser rejects fullscreen', () => {
              let warnSpy: jest.SpyInstance

              beforeEach(() => {
                warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
                requestFullscreen.mockRejectedValueOnce(new Error('fullscreen denied'))
                clickButton('discover.scene.fullscreen')
              })

              it('should log the rejection', async () => {
                await waitFor(() => expect(warnSpy).toHaveBeenCalledWith('[SceneLiveWatcher] fullscreen rejected', expect.any(Error)))
              })

              describe('and leaving fullscreen is rejected too', () => {
                beforeEach(() => {
                  exitFullscreen.mockRejectedValueOnce(new Error('not active'))
                  fireEvent(document, new Event('fullscreenchange'))
                  clickButton('discover.scene.exit_fullscreen')
                })

                it('should swallow the rejection after trying to exit', () => {
                  expect(exitFullscreen).toHaveBeenCalledTimes(1)
                })
              })
            })
          })
        })
      })

      describe('and no streaming href could be resolved', () => {
        beforeEach(() => {
          props = { ...props, streamingHref: null }
          renderCard()
        })

        it('should disable the launch CTA without a fullscreen control', () => {
          expect(screen.getByRole('button', { name: 'discover.scene.explore_scene' })).toBeDisabled()
          expect(screen.queryByRole('button', { name: 'discover.scene.fullscreen' })).not.toBeInTheDocument()
        })
      })

      describe('and the visitor is on a touch device', () => {
        beforeEach(() => {
          mockUseAdvancedUserAgentData.mockReturnValue([false, { mobile: true }])
          renderCard()
        })

        it('should render the store card instead of the launch CTA', () => {
          expect(screen.getByText('discover.scene.mobile_unsupported.title')).toBeInTheDocument()
          expect(screen.queryByRole('button', { name: 'discover.scene.explore_scene' })).not.toBeInTheDocument()
        })

        it('should link to the App Store on a non-Android device', () => {
          expect(screen.getByRole('link')).toHaveAttribute('href', expect.stringContaining('apps.apple.com'))
        })
      })
    })

    describe('and the room is ready', () => {
      beforeEach(() => {
        props = {
          status: 'ready',
          mode: 'scene',
          streamingHref: 'https://decentraland.zone/bevy-web/?position=-9%2C-9',
          place
        }
        mockUseTracks.mockReturnValue([])
        mockUsePresentationOptional.mockReturnValue(null)
      })

      describe('and nothing is broadcasting', () => {
        beforeEach(() => {
          renderCard()
        })

        it('should render tabless with the launch CTA', () => {
          expect(screen.queryByRole('button', { name: 'discover.scene.tab_video' })).not.toBeInTheDocument()
          expect(screen.getByRole('button', { name: 'discover.scene.explore_scene' })).toBeInTheDocument()
        })

        describe('and EXPLORE THE SCENE is clicked', () => {
          beforeEach(() => {
            clickButton('discover.scene.explore_scene')
          })

          it('should mount the bevy iframe and surface STOP', () => {
            expect(screen.getByTitle('discover.scene.tab_streaming')).toBeInTheDocument()
            expect(screen.getByRole('button', { name: 'discover.scene.close_media' })).toBeInTheDocument()
          })
        })
      })

      describe('and a client-composed presentation is live', () => {
        beforeEach(() => {
          mockUsePresentationOptional.mockReturnValue({
            state: { slide: { url: 'https://presenter.test/presentations/p1/slides/ab12.png', width: 1920, height: 1080 } }
          })
          renderCard()
        })

        it('should surface the VIDEO tab and start on the presentation', () => {
          expect(screen.getByRole('button', { name: 'discover.scene.tab_video' })).toBeInTheDocument()
          expect(screen.getByTestId('scene-room-content')).toBeInTheDocument()
        })
      })

      describe('and a live video broadcast is on', () => {
        beforeEach(() => {
          mockUseTracks.mockReturnValue([{ publication: { isMuted: false } }])
        })

        describe('and the room runs in cast mode', () => {
          beforeEach(() => {
            props = { ...props, mode: 'cast' }
            renderCard()
          })

          it('should render the cast watcher surface', () => {
            expect(screen.getByTestId('watcher-view-content')).toBeInTheDocument()
          })
        })

        describe('and the room runs in scene mode', () => {
          beforeEach(() => {
            renderCard()
          })

          it('should surface the VIDEO / SCENE WEB tab strip and start on the video', () => {
            expect(screen.getByRole('button', { name: 'discover.scene.tab_streaming' })).toBeInTheDocument()
            expect(screen.getByTestId('scene-room-content')).toBeInTheDocument()
          })

          describe('and STOP is clicked', () => {
            beforeEach(() => {
              clickButton('discover.scene.close_media')
            })

            it('should pause the video', () => {
              expect(screen.queryByTestId('scene-room-content')).not.toBeInTheDocument()
            })

            describe('and the resume CTA is clicked', () => {
              beforeEach(() => {
                clickButton('discover.scene.resume_cta')
              })

              it('should show the video again', () => {
                expect(screen.getByTestId('scene-room-content')).toBeInTheDocument()
              })
            })
          })

          describe('and the SCENE WEB tab is selected', () => {
            beforeEach(() => {
              clickButton('discover.scene.tab_streaming')
            })

            it('should swap the video for the launch CTA', () => {
              expect(screen.queryByTestId('scene-room-content')).not.toBeInTheDocument()
              expect(screen.getByRole('button', { name: 'discover.scene.explore_scene' })).toBeInTheDocument()
            })

            describe('and the VIDEO tab is selected again', () => {
              beforeEach(() => {
                clickButton('discover.scene.tab_video')
              })

              it('should show the video again', () => {
                expect(screen.getByTestId('scene-room-content')).toBeInTheDocument()
              })
            })

            describe('and the scene is launched and then stopped', () => {
              beforeEach(() => {
                clickButton('discover.scene.explore_scene')
                clickButton('discover.scene.close_media')
              })

              it('should unmount the bevy iframe and restore the launch CTA', () => {
                expect(screen.queryByTitle('discover.scene.tab_streaming')).not.toBeInTheDocument()
                expect(screen.getByRole('button', { name: 'discover.scene.explore_scene' })).toBeInTheDocument()
              })
            })
          })

          describe('and the broadcast ends', () => {
            beforeEach(() => {
              mockUseTracks.mockReturnValue([])
              view.rerender(<SceneWatcherCard {...props} />)
            })

            it('should fall back to the scene tab with the launch CTA', () => {
              expect(screen.queryByTestId('scene-room-content')).not.toBeInTheDocument()
              expect(screen.getByRole('button', { name: 'discover.scene.explore_scene' })).toBeInTheDocument()
            })
          })
        })
      })
    })
  })

  describe('when rendering the chat dock', () => {
    describe('and the room is still loading', () => {
      beforeEach(() => {
        render(<SceneChatDock status="loading" sceneName="Genesis Plaza" jumpHref="decentraland://?position=-9%2C-9" />)
      })

      it('should render the In-World Chat header with the empty state', () => {
        expect(screen.getByText('page.cast.chat.title')).toBeInTheDocument()
        expect(screen.getByText('page.cast.chat.no_messages_yet')).toBeInTheDocument()
      })

      it('should deep-link the scene name in the jump-in footer', () => {
        expect(screen.getByRole('link', { name: 'Genesis Plaza' })).toHaveAttribute('href', 'decentraland://?position=-9%2C-9')
      })
    })

    describe('and the room could not be joined', () => {
      beforeEach(() => {
        render(<SceneChatDock status="no-broadcast" sceneName="Genesis Plaza" />)
      })

      it('should say the chat is unavailable', () => {
        expect(screen.getByText('page.cast.chat.unavailable')).toBeInTheDocument()
      })

      it('should fall back to the plain footer without a deep link', () => {
        expect(screen.queryByRole('link')).not.toBeInTheDocument()
        expect(screen.getByText('page.cast.chat.footer_text')).toBeInTheDocument()
      })
    })

    describe('and the room is ready', () => {
      let setChatOpen: jest.Mock
      let view: RenderResult

      beforeEach(() => {
        setChatOpen = jest.fn()
        mockUseChatContext.mockReturnValue({ chatMessages: [], markMessagesAsRead: jest.fn(), setChatOpen })
        view = render(<SceneChatDock status="ready" sceneName="Genesis Plaza" />)
      })

      it('should mark the chat open for the unread counters', () => {
        expect(setChatOpen).toHaveBeenCalledWith(true)
      })

      describe('and the dock unmounts', () => {
        beforeEach(() => {
          view.unmount()
        })

        it('should mark the chat closed again', () => {
          expect(setChatOpen).toHaveBeenLastCalledWith(false)
        })
      })
    })
  })
})
