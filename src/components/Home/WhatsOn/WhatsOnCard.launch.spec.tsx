import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExploreCardType } from '../../../features/events/events.discovery.types'
import type { ExploreItem } from '../../../features/events/events.discovery.types'
import { SegmentEvent } from '../../../modules/segment'
import { WhatsOnCard } from './WhatsOnCard'

// Integration check of the card's Jump In with the REAL useLaunchExplorer / useExplorerLauncher /
// useDownloadModalProps. Only the protocol and device boundary is replaced: ui2's launchDesktopApp,
// launchMobileApp, the user-agent data and the analytics client.
jest.mock('decentraland-ui2/dist/config', () => ({ config: { get: () => undefined } }))
jest.mock('decentraland-ui2/dist/modules/cdnReleases', () => ({ CDNSource: {}, getCDNRelease: jest.fn() }))

const mockLaunchDesktopApp = jest.fn()
jest.mock('decentraland-ui2', () => ({
  ...jest.requireActual('../../../__test-utils__/ui2Mock').createUi2Mock(),
  BadgeGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LiveBadge: () => <span>live</span>,
  UserCountBadge: () => <span />,
  launchDesktopApp: (...args: unknown[]) => mockLaunchDesktopApp(...args),
  DownloadModal: ({ open, downloadUrl }: { open: boolean; downloadUrl: string }) =>
    open ? <div data-testid="download-modal" data-download-url={downloadUrl} /> : null,
  // Mirrors ui2's EventCard contract: onJumpInClick stops the click from reaching the card.
  EventCard: ({ sceneName, onClick, onJumpInClick }: { sceneName: string; onClick?: () => void; onJumpInClick?: () => void }) => (
    <div>
      <button data-testid="card-action" onClick={onClick}>
        {sceneName}
      </button>
      <button
        data-testid="jump-in"
        onClick={event => {
          event.stopPropagation()
          onJumpInClick?.()
        }}
      >
        jump in
      </button>
    </div>
  )
}))

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

jest.mock('../../../hooks/useTotalDownloads', () => ({ useTotalDownloads: () => '+400K' }))
jest.mock('../../../hooks/useDownloadClick', () => ({ useDownloadClick: () => jest.fn() }))
jest.mock('../../../config/env', () => ({ getEnv: () => undefined }))
jest.mock('../../../features/profile/profile.client', () => ({ useGetProfileQuery: () => ({ data: undefined }) }))
jest.mock('../../../hooks/adapters/useTrackLinkContext', () => ({ useTrackClick: () => jest.fn() }))
jest.mock('../../../hooks/useDeferredTrack', () => ({ useDeferredTrack: () => jest.fn() }))
jest.mock('../../../utils/assetUrl', () => ({ assetUrl: (path: string) => `https://cdn.example.com${path}` }))
jest.mock('./WhatsOn.styled', () => ({
  CardWrapper: jest
    .requireActual<typeof React>('react')
    .forwardRef(({ children }: { children: React.ReactNode }, ref: React.Ref<HTMLDivElement>) => <div ref={ref}>{children}</div>)
}))

const card: ExploreItem = {
  type: ExploreCardType.PLACE,
  id: 'place-1',
  title: 'Genesis Plaza',
  users: 12,
  image: '',
  coordinates: '3,4',
  isGenesisPlaza: false
}

const onSelect = jest.fn()

const renderCard = () =>
  render(
    <MemoryRouter>
      <WhatsOnCard card={card} onSelect={onSelect} />
    </MemoryRouter>
  )

describe('when Jump In is clicked on a whats on card with the real launch hook', () => {
  let openSpy: jest.SpyInstance

  beforeEach(() => {
    mockIsMobile = false
    openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    openSpy.mockRestore()
    jest.resetAllMocks()
  })

  describe('and the desktop client is not installed', () => {
    beforeEach(async () => {
      mockLaunchDesktopApp.mockResolvedValue(false)
      renderCard()
      await userEvent.click(screen.getByTestId('jump-in'))
    })

    it('should launch the deep link at the card position', () => {
      expect(mockLaunchDesktopApp).toHaveBeenCalledWith(expect.objectContaining({ position: '3,4' }))
    })

    it('should open the card download modal carrying the position as the target', async () => {
      const modal = await screen.findByTestId('download-modal')
      expect(decodeURIComponent(modal.getAttribute('data-download-url') as string)).toContain('position=3,4')
    })

    it('should track the launch attempt and that the client is not installed', () => {
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.GO_TO_EXPLORER, expect.objectContaining({ position: '3,4' }))
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.CLICK, expect.objectContaining({ event: SegmentEvent.CLIENT_NOT_INSTALLED }))
    })

    it('should not open the detail modal', () => {
      expect(onSelect).not.toHaveBeenCalled()
    })
  })

  describe('and the launch throws', () => {
    beforeEach(async () => {
      mockLaunchDesktopApp.mockRejectedValue(new Error('protocol blocked'))
      renderCard()
      await userEvent.click(screen.getByTestId('jump-in'))
    })

    it('should open the card download modal', async () => {
      expect(await screen.findByTestId('download-modal')).toBeInTheDocument()
    })

    it('should not report the client as not installed, since a rejection is not proof', () => {
      expect(mockTrack).not.toHaveBeenCalledWith(SegmentEvent.CLICK, expect.objectContaining({ event: SegmentEvent.CLIENT_NOT_INSTALLED }))
    })

    it('should not open the detail modal', () => {
      expect(onSelect).not.toHaveBeenCalled()
    })
  })

  describe('and the client launches', () => {
    beforeEach(async () => {
      mockLaunchDesktopApp.mockResolvedValue(true)
      renderCard()
      await userEvent.click(screen.getByTestId('jump-in'))
      await waitFor(() => expect(mockLaunchDesktopApp).toHaveBeenCalledTimes(1))
    })

    it('should not open the download modal', () => {
      expect(screen.queryByTestId('download-modal')).toBeNull()
    })

    it('should not open the detail modal', () => {
      expect(onSelect).not.toHaveBeenCalled()
    })
  })

  describe('and the device is a phone', () => {
    beforeEach(() => {
      mockIsMobile = true
    })

    describe('and the app takes the deep link', () => {
      beforeEach(async () => {
        mockLaunchMobileApp.mockResolvedValue(true)
        renderCard()
        await userEvent.click(screen.getByTestId('jump-in'))
        await waitFor(() => expect(mockLaunchMobileApp).toHaveBeenCalledTimes(1))
      })

      it('should not touch the desktop launcher, the store or the detail modal', () => {
        expect(mockLaunchDesktopApp).not.toHaveBeenCalled()
        expect(openSpy).not.toHaveBeenCalled()
        expect(onSelect).not.toHaveBeenCalled()
      })
    })

    describe('and the app is missing', () => {
      beforeEach(async () => {
        mockLaunchMobileApp.mockResolvedValue(false)
        renderCard()
        await userEvent.click(screen.getByTestId('jump-in'))
        await waitFor(() => expect(openSpy).toHaveBeenCalledTimes(1))
      })

      it('should send the same tab to the store and never render the desktop download modal', () => {
        expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('http'), '_self')
        expect(screen.queryByTestId('download-modal')).toBeNull()
        expect(onSelect).not.toHaveBeenCalled()
      })
    })
  })
})
