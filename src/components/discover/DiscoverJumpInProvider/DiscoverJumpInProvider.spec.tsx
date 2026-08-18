import { MemoryRouter } from 'react-router-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { launchDesktopApp } from 'decentraland-ui2'
import { getEnv } from '../../../config/env'
import type { DiscoverPlace } from '../../../features/discover'
import { useAnonUserId } from '../../../hooks/useAnonUserId'
import { detectDownloadOS } from '../../../modules/downloadConstants'
import { SegmentEvent } from '../../../modules/segment.types'
import { DiscoverJumpInProvider, useDiscoverJumpIn } from './DiscoverJumpInProvider'

const mockTrack = jest.fn()
jest.mock('../../../hooks/useDeferredTrack', () => ({ useDeferredTrack: () => mockTrack }))
jest.mock('../../../hooks/useTotalDownloads', () => ({ useTotalDownloads: () => '+400K' }))
jest.mock('../../../hooks/useAnonUserId', () => ({ useAnonUserId: jest.fn() }))
jest.mock('../../../config/env', () => ({ getEnv: jest.fn() }))
jest.mock('@dcl/hooks', () => ({ useAdvancedUserAgentData: jest.fn() }))
jest.mock('decentraland-ui2', () => ({
  launchDesktopApp: jest.fn(),
  // Minimal DownloadModal stand-in that surfaces the props the flow drives.
  DownloadModal: ({ open, downloadUrl, onClose }: { open: boolean; downloadUrl: string; onClose: () => void }) =>
    open ? (
      <div data-testid="download-modal" data-download-url={downloadUrl}>
        <button type="button" onClick={onClose}>
          close-modal
        </button>
      </div>
    ) : null
}))
jest.mock('../../../modules/downloadConstants', () => ({
  DOWNLOAD_URLS: {
    apple: 'https://dl.test/apple',
    windows: 'https://dl.test/windows',
    epic: 'https://epic',
    googlePlay: 'https://gplay',
    appStore: 'https://appstore'
  },
  detectDownloadOS: jest.fn(() => 'apple'),
  // Pure helper with no env access — keep the real one so the assertions below
  // check the universal link the user actually gets.
  buildMobileDeepLinkUrl: jest.requireActual('../../../modules/downloadConstants').buildMobileDeepLinkUrl
}))
// The barrel re-exports RTK clients (import.meta env access Jest can't parse);
// the provider only consumes the pure helpers, so alias to them.
jest.mock('../../../features/discover', () => jest.requireActual('../../../features/discover/discover.helpers'))
// url.ts + downloadTrackingParams pull ESM-only ui2 config; stub with the same
// shape useLaunchExplorer.spec uses so the download URL still reflects params.
jest.mock('../../../modules/url', () => ({
  buildTrackedDownloadUrl: (base: string, params: Record<string, string | undefined | null>) => {
    const url = new URL(base, 'https://sites.test')
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.append(key, value)
    })
    return url.toString()
  }
}))
jest.mock('../../../modules/downloadTrackingParams', () => ({
  buildDownloadTrackingParams: (anonUserId: string | undefined, deepLinkParams: Record<string, string | undefined> = {}) => ({
    ...deepLinkParams,
    anon_user_id: anonUserId
  })
}))

const mockedLaunch = launchDesktopApp as jest.MockedFunction<typeof launchDesktopApp>
const mockedUserAgent = useAdvancedUserAgentData as jest.MockedFunction<typeof useAdvancedUserAgentData>
const mockedAnonUserId = useAnonUserId as jest.MockedFunction<typeof useAnonUserId>
const mockedDetectOS = detectDownloadOS as jest.MockedFunction<typeof detectDownloadOS>
const mockedGetEnv = getEnv as jest.MockedFunction<typeof getEnv>

const place = { id: 'p-1', title: 'Genesis Plaza', base_position: '-3,-2', world: false } as DiscoverPlace
const worldPlace = { id: 'w-1', title: 'AliceWorld', world: true, world_name: 'AliceWorld' } as DiscoverPlace

// A consumer that fires jumpIn on click, so we exercise the real context.
function JumpInProbe({ target = place, surface = 'place-card' }: { target?: DiscoverPlace; surface?: string }) {
  const { jumpIn } = useDiscoverJumpIn()
  return (
    <button type="button" onClick={() => jumpIn(target, surface)}>
      jump
    </button>
  )
}

function renderProvider(ui = <JumpInProbe />) {
  return render(
    <MemoryRouter initialEntries={['/discover']}>
      <DiscoverJumpInProvider>{ui}</DiscoverJumpInProvider>
    </MemoryRouter>
  )
}

describe('DiscoverJumpInProvider', () => {
  let originalOpen: typeof window.open

  beforeEach(() => {
    mockedUserAgent.mockReturnValue([false, { mobile: false, os: { name: 'macOS' }, cpu: { architecture: 'arm64' } }] as never)
    mockedAnonUserId.mockReturnValue('anon-123')
    mockedDetectOS.mockReturnValue('apple')
    mockedGetEnv.mockReturnValue(undefined as never)
    originalOpen = window.open
    window.open = jest.fn()
  })

  afterEach(() => {
    window.open = originalOpen
    jest.resetAllMocks()
  })

  describe('when the desktop client is installed', () => {
    it('should deep-link into the client and never open the download modal', async () => {
      mockedLaunch.mockResolvedValue(true)
      renderProvider()

      await act(async () => {
        fireEvent.click(screen.getByText('jump'))
      })

      expect(mockedLaunch).toHaveBeenCalledWith(expect.objectContaining({ position: '-3,-2' }))
      expect(screen.queryByTestId('download-modal')).not.toBeInTheDocument()
    })

    it('should track DISCOVER_JUMP_IN with the place payload and surface', async () => {
      mockedLaunch.mockResolvedValue(true)
      renderProvider(<JumpInProbe surface="featured-card" />)

      await act(async () => {
        fireEvent.click(screen.getByText('jump'))
      })

      expect(mockTrack).toHaveBeenCalledWith(
        SegmentEvent.DISCOVER_JUMP_IN,
        expect.objectContaining({ place: 'featured-card', place_id: 'p-1' })
      )
    })

    it('should target the world realm for world places', async () => {
      mockedLaunch.mockResolvedValue(true)
      renderProvider(<JumpInProbe target={worldPlace} />)

      await act(async () => {
        fireEvent.click(screen.getByText('jump'))
      })

      expect(mockedLaunch).toHaveBeenCalledWith(expect.objectContaining({ realm: 'aliceworld' }))
    })
  })

  describe('when the desktop client is not installed', () => {
    it('should open the download modal carrying the deep-link + anon params', async () => {
      mockedLaunch.mockResolvedValue(false)
      renderProvider()

      await act(async () => {
        fireEvent.click(screen.getByText('jump'))
      })

      const modal = await screen.findByTestId('download-modal')
      const url = modal.getAttribute('data-download-url') ?? ''
      expect(url).toContain('position=-3%2C-2')
      expect(url).toContain('anon_user_id=anon-123')
    })

    it('should close the modal when the user dismisses it', async () => {
      mockedLaunch.mockResolvedValue(false)
      renderProvider()

      await act(async () => {
        fireEvent.click(screen.getByText('jump'))
      })
      expect(await screen.findByTestId('download-modal')).toBeInTheDocument()

      fireEvent.click(screen.getByText('close-modal'))

      expect(screen.queryByTestId('download-modal')).not.toBeInTheDocument()
    })

    it('should fall back to the modal on a launch rejection without tracking CLIENT_NOT_INSTALLED', async () => {
      mockedLaunch.mockRejectedValue(new Error('blocked'))
      renderProvider()

      await act(async () => {
        fireEvent.click(screen.getByText('jump'))
      })

      await waitFor(() => expect(screen.getByTestId('download-modal')).toBeInTheDocument())
      // A throw isn't proof the client is absent — matches the homepage flow.
      expect(mockTrack).not.toHaveBeenCalledWith(SegmentEvent.CLICK, expect.objectContaining({ event: SegmentEvent.CLIENT_NOT_INSTALLED }))
    })

    it('should track the client-not-installed click', async () => {
      mockedLaunch.mockResolvedValue(false)
      renderProvider()

      await act(async () => {
        fireEvent.click(screen.getByText('jump'))
      })

      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.CLICK, expect.objectContaining({ event: SegmentEvent.CLIENT_NOT_INSTALLED }))
    })
  })

  describe('when on a mobile device', () => {
    it('should open the universal-link handler at the place position and never launch or prompt', async () => {
      mockedUserAgent.mockReturnValue([false, { mobile: true, os: { name: 'iOS' } }] as never)
      renderProvider()

      await act(async () => {
        fireEvent.click(screen.getByText('jump'))
      })

      expect(window.open).toHaveBeenCalledWith('https://mobile.dclexplorer.com/open?position=-3%2C-2', '_self')
      expect(mockedLaunch).not.toHaveBeenCalled()
      expect(screen.queryByTestId('download-modal')).not.toBeInTheDocument()
    })

    it('should open the universal-link handler with the realm for a world', async () => {
      mockedUserAgent.mockReturnValue([false, { mobile: true, os: { name: 'Android' } }] as never)
      renderProvider(<JumpInProbe target={worldPlace} />)

      await act(async () => {
        fireEvent.click(screen.getByText('jump'))
      })

      expect(window.open).toHaveBeenCalledWith('https://mobile.dclexplorer.com/open?realm=aliceworld', '_self')
    })
  })

  describe('when used outside a provider', () => {
    it('should expose a no-op jumpIn that warns instead of throwing', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
      render(<JumpInProbe />)

      expect(() => fireEvent.click(screen.getByText('jump'))).not.toThrow()
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('outside DiscoverJumpInProvider'))
      warnSpy.mockRestore()
    })
  })
})
