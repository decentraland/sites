import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { DiscoverPlace } from '../../features/discover'
import { DiscoverScenePage } from './DiscoverScenePage'

const mockNavigate = jest.fn()
const mockUseParams = jest.fn()
const mockUseLocation = jest.fn()
const mockPlaceQuery = jest.fn()
const mockWorldQuery = jest.fn()
const mockHotScenesQuery = jest.fn()
const mockLiveWorldsQuery = jest.fn()
const mockFetchWorldScenes = jest.fn()
const mockUseSceneRoom = jest.fn()
const mockUseAdvancedUserAgentData = jest.fn()
const mockUsePageViewTracking = jest.fn()

jest.mock('react-helmet-async', () => ({
  Helmet: () => null
}))

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
  useLocation: () => mockUseLocation()
}))

// The barrel re-exports the RTK Query clients (import.meta env access Jest
// can't parse); keep the pure helpers real and stub only the query hooks.
jest.mock('../../features/discover', () => ({
  ...jest.requireActual('../../features/discover/discover.helpers'),
  useGetDiscoverPlaceByPositionQuery: (...args: unknown[]) => mockPlaceQuery(...args),
  useGetDiscoverWorldByNameQuery: (...args: unknown[]) => mockWorldQuery(...args),
  useGetHotScenesQuery: (...args: unknown[]) => mockHotScenesQuery(...args),
  useGetLiveWorldsQuery: (...args: unknown[]) => mockLiveWorldsQuery(...args)
}))

jest.mock('../../features/discover/sceneAdapter', () => ({
  fetchWorldScenes: (...args: unknown[]) => mockFetchWorldScenes(...args)
}))

// Heavy LiveKit-backed children — substituted with prop-surfacing stubs.
jest.mock('../../components/discover/SceneLiveWatcher', () => ({
  SceneRoomMount: ({ credentials, children }: { credentials: unknown; children?: React.ReactNode }) => (
    <div data-testid="room-mount" data-has-credentials={credentials ? 'yes' : 'no'}>
      {children}
    </div>
  ),
  SceneWatcherCard: (props: {
    status: string
    streamingHref?: string | null
    place?: { base_position?: string } | null
    initialUserCount?: number
  }) => (
    <div
      data-testid="watcher-card"
      data-status={props.status}
      data-streaming={props.streamingHref ?? ''}
      data-place={props.place?.base_position ?? ''}
      data-count={props.initialUserCount}
    />
  ),
  SceneChatDock: (props: { status: string; sceneName?: string }) => (
    <div data-testid="chat-dock" data-status={props.status} data-scene={props.sceneName} />
  )
}))

jest.mock('../../components/discover/SceneJumpInModal', () => ({
  SceneJumpInModal: (props: { place: { title: string }; liveCount?: number; onClose: () => void }) => (
    <div role="dialog" aria-label={props.place.title} data-live-count={props.liveCount}>
      <button type="button" onClick={props.onClose}>
        close-scene-modal
      </button>
    </div>
  )
}))

jest.mock('../../config/env', () => ({
  getEnv: () => undefined
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id?: string | null) => id ?? ''
}))

jest.mock('../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => ({ identity: undefined, hasValidIdentity: false, address: undefined })
}))

jest.mock('../../hooks/usePageViewTracking', () => ({
  usePageViewTracking: (...args: unknown[]) => mockUsePageViewTracking(...args)
}))

jest.mock('../../hooks/usePlaceOwnerAvatar', () => ({
  usePlaceOwnerAvatar: () => ({ ownerName: 'CreatorName', ownerAvatar: 'https://avatar.test/a.png', avatarBg: '#123456' })
}))

jest.mock('../../hooks/useSceneRoom', () => ({
  useSceneRoom: (...args: unknown[]) => mockUseSceneRoom(...args)
}))

jest.mock('@dcl/hooks', () => ({
  useAdvancedUserAgentData: () => mockUseAdvancedUserAgentData()
}))

// Run the real DiscoverScenePage.styled.ts through the shared styled shim
// instead of the emotion engine (decentraland-ui2 ships ESM Jest can't
// transform).
jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../__test-utils__/styledMock')
  return {
    ...actual,
    Typography: actual.Box,
    dclColors: {
      base: { primary: '#ff2d55', primaryDark1: '#e6284c' },
      neutral: { softWhite: '#fcfcfc', gray3: '#a09ba8', gray5: '#ecebed', softBlack1: '#161518', white: '#ffffff' },
      blackTransparent: { backdrop: 'rgba(0,0,0,0.6)', blurry: 'rgba(0,0,0,0.4)' },
      whiteTransparent: { blurry: 'rgba(255,255,255,0.2)', subtle: 'rgba(255,255,255,0.1)' }
    }
  }
})

function createPlace(overrides: Partial<DiscoverPlace> = {}): DiscoverPlace {
  return {
    id: 'place-1',
    title: 'Exhibition Hall',
    description: 'Rotating art exhibits',
    image: 'https://img.test/cover.png',
    positions: ['10,20', '10,21'],
    base_position: '10,20',
    owner: '0xabc',
    user_name: 'CreatorName',
    ...overrides
  }
}

describe('DiscoverScenePage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ position: '10,20' })
    mockUseLocation.mockReturnValue({ state: null })
    mockPlaceQuery.mockReturnValue({ data: undefined, isLoading: false })
    mockWorldQuery.mockReturnValue({ data: undefined, isLoading: false })
    mockHotScenesQuery.mockReturnValue({ data: [], isLoading: false })
    mockLiveWorldsQuery.mockReturnValue({ data: [], isLoading: false })
    mockFetchWorldScenes.mockResolvedValue([])
    mockUseSceneRoom.mockReturnValue({ status: 'loading', mode: 'scene', credentials: null })
    mockUseAdvancedUserAgentData.mockReturnValue([false, { mobile: false }])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the position param is not a valid parcel', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({ position: 'not-a-parcel' })
    })

    it('should render the not-found state', async () => {
      render(<DiscoverScenePage kind="place" />)

      expect(await screen.findByText('discover.scene.not_found.title')).toBeInTheDocument()
      expect(screen.getByText('discover.scene.not_found.description')).toBeInTheDocument()
    })
  })

  describe('when the scene is empty (nobody in-world)', () => {
    beforeEach(() => {
      mockPlaceQuery.mockReturnValue({ data: createPlace(), isLoading: false })
    })

    it('should render the JUMP IN modal with a zero live count instead of the watcher', () => {
      render(<DiscoverScenePage kind="place" />)

      const dialog = screen.getByRole('dialog', { name: 'Exhibition Hall' })
      expect(dialog).toHaveAttribute('data-live-count', '0')
      expect(screen.queryByTestId('watcher-card')).not.toBeInTheDocument()
    })

    it('should navigate back to the discover grid when the modal closes', () => {
      render(<DiscoverScenePage kind="place" />)

      fireEvent.click(screen.getByRole('button', { name: 'close-scene-modal' }))

      expect(mockNavigate).toHaveBeenCalledWith('/discover')
    })

    it('should not open the LiveKit room for an empty scene', () => {
      render(<DiscoverScenePage kind="place" />)

      expect(mockUseSceneRoom).toHaveBeenCalledWith(expect.objectContaining({ location: '' }))
    })
  })

  describe('when presence is matched by baseCoords only', () => {
    beforeEach(() => {
      mockPlaceQuery.mockReturnValue({ data: createPlace(), isLoading: false })
      // The hot scene's parcel envelope contains this place, but its
      // baseCoords belong to a NEIGHBOURING scene — must not count as live.
      mockHotScenesQuery.mockReturnValue({
        data: [{ id: 'hs-1', name: 'Bouncy Castle', baseCoords: [99, 99], usersTotalCount: 12, realms: [], parcels: [[10, 20]] }],
        isLoading: false
      })
    })

    it('should treat the scene as empty when no hot scene bases at its parcels', () => {
      render(<DiscoverScenePage kind="place" />)

      expect(screen.getByRole('dialog', { name: 'Exhibition Hall' })).toHaveAttribute('data-live-count', '0')
    })
  })

  describe('when the scene has live players on desktop', () => {
    beforeEach(() => {
      mockPlaceQuery.mockReturnValue({ data: createPlace(), isLoading: false })
      mockHotScenesQuery.mockReturnValue({
        data: [{ id: 'hs-1', name: 'Exhibition Hall', baseCoords: [10, 20], usersTotalCount: 7, realms: [], parcels: [] }],
        isLoading: false
      })
      mockUseSceneRoom.mockReturnValue({
        status: 'ready',
        mode: 'scene',
        credentials: { url: 'wss://livekit.test', token: 'jwt', identity: 'guest', roomId: '' }
      })
    })

    it('should render the watcher card with the live presence snapshot', () => {
      render(<DiscoverScenePage kind="place" />)

      const watcher = screen.getByTestId('watcher-card')
      expect(watcher).toHaveAttribute('data-status', 'ready')
      expect(watcher).toHaveAttribute('data-count', '7')
      expect(watcher).toHaveAttribute('data-place', '10,20')
      expect(watcher.getAttribute('data-streaming')).toContain('https://decentraland.zone/bevy-web/?position=10%2C20')
    })

    it('should render the chat dock next to the viewer with the scene title', () => {
      render(<DiscoverScenePage kind="place" />)

      const dock = screen.getByTestId('chat-dock')
      expect(dock).toHaveAttribute('data-status', 'ready')
      expect(dock).toHaveAttribute('data-scene', 'Exhibition Hall')
    })

    it('should mount the room with the resolved credentials', () => {
      render(<DiscoverScenePage kind="place" />)

      expect(screen.getByTestId('room-mount')).toHaveAttribute('data-has-credentials', 'yes')
      expect(mockUseSceneRoom).toHaveBeenCalledWith(expect.objectContaining({ location: '10,20' }))
    })

    it('should render the header with title, creator and coordinates tag', () => {
      render(<DiscoverScenePage kind="place" />)

      expect(screen.getByText('Exhibition Hall')).toBeInTheDocument()
      expect(screen.getByText('CreatorName')).toBeInTheDocument()
      expect(screen.getByText('10,20')).toBeInTheDocument()
    })

    it('should render the WHAT TO EXPECT panel with the place description', () => {
      render(<DiscoverScenePage kind="place" />)

      expect(screen.getByText('discover.scene.what_to_expect')).toBeInTheDocument()
      expect(screen.getByText('Rotating art exhibits')).toBeInTheDocument()
    })

    it('should fire the page tracking with the resolved place payload', () => {
      render(<DiscoverScenePage kind="place" />)

      expect(mockUsePageViewTracking).toHaveBeenCalledWith({
        name: 'Exhibition Hall',
        properties: { kind: 'place', place_id: 'place-1', world: null }
      })
    })
  })

  describe('when the visitor is on mobile and the scene is live', () => {
    beforeEach(() => {
      mockUseAdvancedUserAgentData.mockReturnValue([false, { mobile: true }])
      mockPlaceQuery.mockReturnValue({ data: createPlace(), isLoading: false })
      mockHotScenesQuery.mockReturnValue({
        data: [{ id: 'hs-1', name: 'Exhibition Hall', baseCoords: [10, 20], usersTotalCount: 7, realms: [], parcels: [] }],
        isLoading: false
      })
    })

    it('should render the JUMP IN modal with the live count instead of the watcher', () => {
      render(<DiscoverScenePage kind="place" />)

      expect(screen.getByRole('dialog', { name: 'Exhibition Hall' })).toHaveAttribute('data-live-count', '7')
      expect(screen.queryByTestId('watcher-card')).not.toBeInTheDocument()
    })

    it('should never open the LiveKit room on mobile', () => {
      render(<DiscoverScenePage kind="place" />)

      expect(mockUseSceneRoom).toHaveBeenCalledWith(expect.objectContaining({ location: '' }))
    })
  })

  describe('when a card click seeds the place through router state', () => {
    beforeEach(() => {
      mockPlaceQuery.mockReturnValue({ data: undefined, isLoading: true })
      mockUseLocation.mockReturnValue({ state: { place: createPlace({ title: 'Seeded Hall' }) } })
    })

    it('should render from the seed before the by-position fetch resolves', () => {
      render(<DiscoverScenePage kind="place" />)

      expect(screen.getByRole('dialog', { name: 'Seeded Hall' })).toBeInTheDocument()
    })

    it('should ignore a stale seed from another scene', () => {
      mockUseLocation.mockReturnValue({ state: { place: createPlace({ title: 'Wrong Hall', positions: ['1,1'], base_position: '1,1' }) } })
      render(<DiscoverScenePage kind="place" />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('when rendering a world', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({ name: 'MyWorld.dcl.eth' })
      mockLiveWorldsQuery.mockReturnValue({ data: [{ worldName: 'MyWorld.dcl.eth', users: 3 }], isLoading: false })
      mockFetchWorldScenes.mockResolvedValue([
        { entityId: 'bafyA', title: 'Main Scene', base: '0,0' },
        { entityId: 'bafyB', title: 'Second Scene', base: '5,5' }
      ])
      mockUseSceneRoom.mockReturnValue({ status: 'ready', mode: 'scene', credentials: null })
    })

    it('should synthesize a place from worlds-content-server when places-api has no metadata', async () => {
      render(<DiscoverScenePage kind="world" />)

      expect(await screen.findByTestId('watcher-card')).toBeInTheDocument()
      expect(mockFetchWorldScenes).toHaveBeenCalledWith('myworld.dcl.eth')
      // Synth place title falls back to the lowercased URL world name.
      expect(screen.getAllByText('myworld.dcl.eth').length).toBeGreaterThan(0)
    })

    it('should open the LiveKit room targeting the auto-selected first scene', async () => {
      render(<DiscoverScenePage kind="world" />)
      await screen.findByTestId('watcher-card')

      await waitFor(() =>
        expect(mockUseSceneRoom).toHaveBeenCalledWith(
          expect.objectContaining({ location: 'myworld.dcl.eth', sceneId: 'bafyA', parcel: '0,0' })
        )
      )
    })

    it('should let the user pick another scene from the multi-scene dropdown', async () => {
      render(<DiscoverScenePage kind="world" />)
      await screen.findByTestId('watcher-card')

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'bafyB' } })

      await waitFor(() =>
        expect(mockUseSceneRoom).toHaveBeenCalledWith(
          expect.objectContaining({ location: 'myworld.dcl.eth', sceneId: 'bafyB', parcel: '5,5' })
        )
      )
    })

    describe('and the world has no scenes anywhere', () => {
      beforeEach(() => {
        mockLiveWorldsQuery.mockReturnValue({ data: [], isLoading: false })
        mockFetchWorldScenes.mockResolvedValue([])
      })

      it('should render the not-found state once everything settles', async () => {
        render(<DiscoverScenePage kind="world" />)

        expect(await screen.findByText('discover.scene.not_found.title')).toBeInTheDocument()
      })
    })
  })
})
