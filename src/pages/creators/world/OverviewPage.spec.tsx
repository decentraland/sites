import { fireEvent, render, screen } from '@testing-library/react'
import type { WorldDeployment } from '../../../features/creators'
import type { DiscoverPlace } from '../../../features/discover'

let mockContext: { worldName: string; deployments: WorldDeployment[]; latest: WorldDeployment | null; place: DiscoverPlace | null }

jest.mock('../../../components/creators/CreatorWorldLayout', () => ({
  useWorldContext: () => mockContext
}))
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))
jest.mock('../../../hooks/useBlogPageTracking', () => ({
  useBlogPageTracking: () => undefined
}))
jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children?: React.ReactNode }) => <>{children}</>
}))
jest.mock('../../../features/discover', () => ({
  buildJumpInHref: () => 'https://jump'
}))
jest.mock('../../../features/storage', () => ({
  truncateAddress: (a: string) => `trunc:${a}`
}))
jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/creatorsUi2Mock'))

// Imported after the mocks so the mocked barrels win.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { OverviewPage } = require('./OverviewPage') as typeof import('./OverviewPage')

function makeDeployment(overrides: Partial<WorldDeployment> = {}): WorldDeployment {
  return {
    entityId: 'bafkentity',
    deployer: '0xdeadbeef',
    title: 'My Scene',
    description: 'A nice scene',
    parcelCount: 4,
    contentFileCount: 10,
    thumbnailUrl: 'https://cdn.example/thumb.png',
    requiredPermissions: [],
    authoritativeMultiplayer: false,
    deployedAt: 1700000000000,
    ...overrides
  }
}

function makePlace(overrides: Partial<DiscoverPlace> = {}): DiscoverPlace {
  return {
    id: 'place1',
    title: 'Place Title',
    description: 'Place desc',
    image: 'https://cdn.example/place.png',
    positions: [],
    owner: null,
    world: true,
    world_name: 'test.dcl.eth',
    user_count: 7,
    ...overrides
  } as DiscoverPlace
}

describe('OverviewPage', () => {
  beforeEach(() => {
    mockContext = { worldName: 'test.dcl.eth', deployments: [], latest: makeDeployment(), place: makePlace() }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the world has a latest deployment and place metadata', () => {
    it('should render the deployment title, live count and deployment info', () => {
      render(<OverviewPage />)
      expect(screen.getByText('My Scene')).toBeInTheDocument()
      expect(screen.getByText('page.creators.world.live_now')).toBeInTheDocument()
      expect(screen.getByText('A nice scene')).toBeInTheDocument()
      expect(screen.getByText('trunc:0xdeadbeef')).toBeInTheDocument()
      expect(screen.getByText('bafkentity')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
    })

    it('should set window.location.href to the jump-in target when Jump in is clicked', () => {
      Object.defineProperty(window, 'location', { value: { href: '' }, writable: true })
      render(<OverviewPage />)
      fireEvent.click(screen.getByText('page.creators.world.jump_in'))
      expect(window.location.href).toBe('https://jump')
    })
  })

  describe('when the world has no latest deployment and no place metadata', () => {
    beforeEach(() => {
      mockContext = { worldName: 'empty.dcl.eth', deployments: [], latest: null, place: null }
    })

    it('should fall back to the world name and render dashes for missing deployment info', () => {
      render(<OverviewPage />)
      // WorldName + MetaLine both render the world name.
      expect(screen.getAllByText('empty.dcl.eth').length).toBeGreaterThan(0)
      // No live user count line.
      expect(screen.queryByText('page.creators.world.live_now')).not.toBeInTheDocument()
      // Dashes for updated / deployer / entity / parcels.
      expect(screen.getAllByText('—').length).toBe(4)
    })
  })
})
