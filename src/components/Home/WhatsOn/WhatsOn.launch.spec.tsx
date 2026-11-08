import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExploreCardType } from '../../../features/events/events.discovery.types'
import type { ExploreItem } from '../../../features/events/events.discovery.types'
import { SegmentEvent } from '../../../modules/segment'
import type { HomeDetailSelection } from '../HomeDetailModal/HomeDetailModal.types'
import { WhatsOn } from './WhatsOn'

// Integration check of the section's Jump In with the REAL WhatsOnCard / useLaunchExplorer /
// useExplorerLauncher / useDownloadModalProps. Only the protocol and device boundary is replaced: ui2's
// launchDesktopApp, launchMobileApp, the user-agent data and the analytics client.
jest.mock('decentraland-ui2/dist/config', () => ({ config: { get: () => undefined } }))
jest.mock('decentraland-ui2/dist/modules/cdnReleases', () => ({ CDNSource: {}, getCDNRelease: jest.fn() }))

const mockLaunchDesktopApp = jest.fn()
jest.mock('decentraland-ui2', () => ({
  ...jest.requireActual('../../../__test-utils__/ui2Mock').createUi2Mock(),
  AnimatedBackground: () => null,
  BadgeGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LiveBadge: () => <span>live</span>,
  UserCountBadge: () => <span />,
  launchDesktopApp: (...args: unknown[]) => mockLaunchDesktopApp(...args),
  DownloadModal: ({ open, onClose, downloadUrl }: { open: boolean; onClose: () => void; downloadUrl: string }) =>
    open ? (
      <div data-testid="download-modal" data-download-url={downloadUrl}>
        <button onClick={onClose}>close download</button>
      </div>
    ) : null,
  // Mirrors ui2's EventCard: JUMP IN sits inside the clickable card area and only stops the click from
  // reaching the card when a handler is set.
  EventCard: ({ sceneName, onClick, onJumpInClick }: { sceneName: string; onClick?: () => void; onJumpInClick?: () => void }) => (
    <div data-testid="card-action" role="button" tabIndex={0} onClick={onClick}>
      {sceneName}
      <span
        data-testid="jump-in"
        onClick={event => {
          if (!onJumpInClick) return
          event.stopPropagation()
          onJumpInClick()
        }}
      />
    </div>
  )
}))

jest.mock('@mui/icons-material/ChevronRight', () => ({ __esModule: true, default: () => null }))

let mockIsMobile = false
const mockTrack = jest.fn()
jest.mock('@dcl/hooks', () => ({
  ...jest.requireActual('@dcl/hooks'),
  useAnalytics: () => ({ track: mockTrack, isInitialized: false }),
  useAdvancedUserAgentData: () => [false, { mobile: mockIsMobile, os: { name: 'Windows' }, cpu: { architecture: 'x86' } }]
}))

const mockLaunchMobileApp = jest.fn()
jest.mock('../../../utils/mobileAppLaunch', () => ({
  launchMobileApp: (...args: unknown[]) => mockLaunchMobileApp(...args)
}))

const mockUseGetWhatsOnDataQuery = jest.fn()
jest.mock('../../../features/events/events.discovery', () => ({
  useGetWhatsOnDataQuery: () => mockUseGetWhatsOnDataQuery()
}))

jest.mock('../../../hooks/useTotalDownloads', () => ({ useTotalDownloads: () => '+400K' }))
jest.mock('../../../hooks/useDownloadClick', () => ({ useDownloadClick: () => jest.fn() }))
jest.mock('../../../config/env', () => ({ getEnv: () => undefined }))
jest.mock('../../../features/profile/profile.client', () => ({ useGetProfileQuery: () => ({ data: undefined }) }))
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({ useFormatMessage: () => (key: string) => key }))
jest.mock('../../../hooks/adapters/useTrackLinkContext', () => ({ useTrackClick: () => jest.fn() }))
jest.mock('../../../hooks/useDeferredTrack', () => ({ useDeferredTrack: () => jest.fn() }))
jest.mock('../../../utils/assetUrl', () => ({ assetUrl: (path: string) => `https://cdn.example.com${path}` }))

const mockCarouselMouseDown = jest.fn()
jest.mock('../../Carousel/Carousel', () => ({
  Carousel: ({
    items,
    renderItem,
    keyExtractor
  }: {
    items: ExploreItem[]
    renderItem: (item: ExploreItem) => React.ReactNode
    keyExtractor: (item: ExploreItem) => string
  }) => (
    <div data-testid="carousel" onMouseDown={mockCarouselMouseDown}>
      {items.map(item => (
        <React.Fragment key={keyExtractor(item)}>{renderItem(item)}</React.Fragment>
      ))}
    </div>
  )
}))

jest.mock('./WhatsOn.styled', () => {
  const { forwardRef } = jest.requireActual<typeof React>('react')
  const passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  return {
    WhatsOnContainer: passthrough,
    SectionTitle: passthrough,
    CardsGrid: ({ children }: { children?: React.ReactNode }) => <div data-testid="grid">{children}</div>,
    MobileCarousel: passthrough,
    ViewAllButton: passthrough,
    CardWrapper: forwardRef(({ children }: { children: React.ReactNode }, ref: React.Ref<HTMLDivElement>) => (
      <div ref={ref}>{children}</div>
    ))
  }
})

const mockLoader = jest.fn()
jest.mock('../HomeDetailModal/HomeDetailModalLoader', () => ({
  HomeDetailModalLoader: (props: { selection: HomeDetailSelection | null }) => {
    mockLoader(props.selection)
    return null
  }
}))

const first: ExploreItem = {
  type: ExploreCardType.PLACE,
  id: 'place-1',
  title: 'Genesis Plaza',
  users: 12,
  image: '',
  coordinates: '3,4',
  isGenesisPlaza: false
}
const second: ExploreItem = { ...first, id: 'place-2', title: 'Fashion District', coordinates: '7,8' }

const downloadUrl = () => decodeURIComponent(screen.getByTestId('download-modal').getAttribute('data-download-url') as string)
const gridJumpIn = (index: number) => within(screen.getByTestId('grid')).getAllByTestId('jump-in')[index]
const carouselJumpIn = (index: number) => within(screen.getByTestId('carousel')).getAllByTestId('jump-in')[index]

const renderSection = () =>
  render(
    <MemoryRouter>
      <WhatsOn />
    </MemoryRouter>
  )

describe('when Jump In is clicked on the whats on section with the real launch hook', () => {
  let openSpy: jest.SpyInstance

  beforeEach(() => {
    mockIsMobile = false
    mockUseGetWhatsOnDataQuery.mockReturnValue({ data: [first, second], isLoading: false })
    openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    openSpy.mockRestore()
    jest.resetAllMocks()
  })

  const lastSelection = () => mockLoader.mock.calls[mockLoader.mock.calls.length - 1][0]

  describe('and the desktop client is not installed', () => {
    beforeEach(async () => {
      mockLaunchDesktopApp.mockResolvedValue(false)
      renderSection()
      await userEvent.click(gridJumpIn(0))
    })

    it('should launch the deep link at the clicked card position', () => {
      expect(mockLaunchDesktopApp).toHaveBeenCalledWith(expect.objectContaining({ position: '3,4' }))
    })

    it('should open a single download modal for every card, targeting the clicked one', async () => {
      expect(await screen.findAllByTestId('download-modal')).toHaveLength(1)
      expect(downloadUrl()).toContain('position=3,4')
    })

    it('should track the launch attempt and that the client is not installed', () => {
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.GO_TO_EXPLORER, expect.objectContaining({ position: '3,4' }))
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.CLICK, expect.objectContaining({ event: SegmentEvent.CLIENT_NOT_INSTALLED }))
    })

    it('should not select a card for the detail modal', () => {
      expect(lastSelection()).toBeNull()
    })

    describe('and the fallback is closed and another card in the carousel is launched', () => {
      beforeEach(async () => {
        await userEvent.click(await screen.findByText('close download'))
        await userEvent.click(carouselJumpIn(1))
      })

      it('should retarget the same modal to the second card', async () => {
        await waitFor(() => expect(mockLaunchDesktopApp).toHaveBeenCalledTimes(2))
        expect(await screen.findAllByTestId('download-modal')).toHaveLength(1)
        expect(downloadUrl()).toContain('position=7,8')
        expect(downloadUrl()).not.toContain('position=3,4')
      })
    })

    describe('and the mouse goes down inside the download modal', () => {
      beforeEach(async () => {
        await screen.findByTestId('download-modal')
        fireEvent.mouseDown(screen.getByText('close download'))
      })

      it('should not reach the carousel drag handler', () => {
        expect(mockCarouselMouseDown).not.toHaveBeenCalled()
      })
    })
  })

  describe('and two launches resolve out of order', () => {
    let resolveFirst: (launched: boolean) => void
    let resolveSecond: (launched: boolean) => void

    beforeEach(async () => {
      mockLaunchDesktopApp
        .mockImplementationOnce(() => new Promise<boolean>(resolve => (resolveFirst = resolve)))
        .mockImplementationOnce(() => new Promise<boolean>(resolve => (resolveSecond = resolve)))
      renderSection()
      await userEvent.click(gridJumpIn(0))
      await userEvent.click(gridJumpIn(1))
    })

    describe('and the newer launch fails first and the older one fails afterwards', () => {
      beforeEach(async () => {
        await act(async () => resolveSecond(false))
        await act(async () => resolveFirst(false))
      })

      it('should keep the modal on the newer card', () => {
        expect(downloadUrl()).toContain('position=7,8')
        expect(downloadUrl()).not.toContain('position=3,4')
      })
    })

    describe('and the modal is closed before the older launch fails', () => {
      beforeEach(async () => {
        await act(async () => resolveSecond(false))
        await userEvent.click(await screen.findByText('close download'))
        await act(async () => resolveFirst(false))
      })

      it('should not reopen the modal from the stale launch', () => {
        expect(screen.queryByTestId('download-modal')).toBeNull()
      })
    })
  })

  describe('and the launch throws', () => {
    beforeEach(async () => {
      mockLaunchDesktopApp.mockRejectedValue(new Error('protocol blocked'))
      renderSection()
      await userEvent.click(carouselJumpIn(0))
    })

    it('should open the download modal for the clicked card', async () => {
      await screen.findByTestId('download-modal')
      expect(downloadUrl()).toContain('position=3,4')
    })

    it('should not report the client as not installed, since a rejection is not proof', () => {
      expect(mockTrack).not.toHaveBeenCalledWith(SegmentEvent.CLICK, expect.objectContaining({ event: SegmentEvent.CLIENT_NOT_INSTALLED }))
    })
  })

  describe('and the client launches', () => {
    beforeEach(async () => {
      mockLaunchDesktopApp.mockResolvedValue(true)
      renderSection()
      await userEvent.click(gridJumpIn(0))
      await waitFor(() => expect(mockLaunchDesktopApp).toHaveBeenCalledTimes(1))
    })

    it('should not open the download modal or the detail modal', () => {
      expect(screen.queryByTestId('download-modal')).toBeNull()
      expect(lastSelection()).toBeNull()
    })
  })

  describe('and a card is clicked instead of its Jump In', () => {
    beforeEach(async () => {
      renderSection()
      await userEvent.click(within(screen.getByTestId('grid')).getAllByTestId('card-action')[0])
    })

    it('should select it for the detail modal without launching the explorer', () => {
      expect(lastSelection()).toEqual({ kind: 'place', item: first })
      expect(mockLaunchDesktopApp).not.toHaveBeenCalled()
    })
  })

  describe('and the device is a phone', () => {
    beforeEach(() => {
      mockIsMobile = true
    })

    describe('and the app takes the deep link', () => {
      beforeEach(async () => {
        mockLaunchMobileApp.mockResolvedValue(true)
        renderSection()
        await userEvent.click(gridJumpIn(0))
        await waitFor(() => expect(mockLaunchMobileApp).toHaveBeenCalledTimes(1))
      })

      it('should not touch the desktop launcher, the store or the detail modal', () => {
        expect(mockLaunchDesktopApp).not.toHaveBeenCalled()
        expect(openSpy).not.toHaveBeenCalled()
        expect(lastSelection()).toBeNull()
      })
    })

    describe('and the app is missing', () => {
      beforeEach(async () => {
        mockLaunchMobileApp.mockResolvedValue(false)
        renderSection()
        await userEvent.click(gridJumpIn(0))
        await waitFor(() => expect(openSpy).toHaveBeenCalledTimes(1))
      })

      it('should send the same tab to the store and never render the desktop download modal', () => {
        expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('http'), '_self')
        expect(screen.queryByTestId('download-modal')).toBeNull()
        expect(lastSelection()).toBeNull()
      })
    })
  })
})
