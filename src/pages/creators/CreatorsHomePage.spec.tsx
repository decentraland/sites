import { fireEvent, render, screen } from '@testing-library/react'
import type { CreatorWorld } from '../../features/creators'

let mockIdentity: unknown
let mockAddress: string | undefined
let mockNames: { data: unknown; isLoading: boolean }
let mockDomains: { data: unknown; isLoading: boolean }
let mockEnrichment: { data: unknown }
let mockMerged: CreatorWorld[]

const mockNavigate = jest.fn()
const mockRedirectToAuth = jest.fn()
const mockMergeCreatorWorlds = jest.fn()

jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }))
jest.mock('react-helmet-async', () => ({ Helmet: ({ children }: { children?: React.ReactNode }) => <>{children}</> }))
jest.mock('../../hooks/adapters/useFormatMessage', () => ({ useFormatMessage: () => (id: string) => id }))
jest.mock('../../hooks/useBlogPageTracking', () => ({ useBlogPageTracking: () => undefined }))
jest.mock('../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => ({ identity: mockIdentity, address: mockAddress })
}))
jest.mock('../../utils/authRedirect', () => ({ redirectToAuth: (...args: unknown[]) => mockRedirectToAuth(...args) }))
jest.mock('../../features/creators', () => ({
  buildCreatorWorldPath: (name: string) => `/creators/world/${name}`,
  mergeCreatorWorlds: (...args: unknown[]) => mockMergeCreatorWorlds(...args)
}))
jest.mock('../../features/discover', () => ({
  useGetDiscoverWorldsByNamesQuery: () => mockEnrichment
}))
jest.mock('../../features/storage', () => ({
  useGetUserDCLNamesQuery: () => mockNames,
  useGetContributableDomainsQuery: () => mockDomains
}))
jest.mock('../../components/creators/WorldCreationCard', () => ({
  WorldCreationCard: ({ world, onSelect }: { world: CreatorWorld; onSelect: (name: string) => void }) => (
    <button
      onClick={() => onSelect(world.name)}
    >{`world:${world.name}:${world.thumbnail ?? 'no-thumb'}:${world.liveUserCount ?? 'no-live'}`}</button>
  )
}))
jest.mock('decentraland-ui2', () => jest.requireActual('../../__test-utils__/creatorsUi2Mock'))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { CreatorsHomePage } = require('./CreatorsHomePage') as typeof import('./CreatorsHomePage')

function makeWorld(overrides: Partial<CreatorWorld> = {}): CreatorWorld {
  return { name: 'world.dcl.eth', ...overrides } as CreatorWorld
}

describe('CreatorsHomePage', () => {
  beforeEach(() => {
    mockIdentity = { authChain: [] }
    mockAddress = '0xowner'
    mockNames = { data: [], isLoading: false }
    mockDomains = { data: [], isLoading: false }
    mockEnrichment = { data: [] }
    mockMerged = [makeWorld()]
    mockMergeCreatorWorlds.mockImplementation(() => mockMerged)
  })
  afterEach(() => jest.resetAllMocks())

  describe('when the wallet is not connected', () => {
    beforeEach(() => {
      mockAddress = undefined
      mockIdentity = undefined
    })

    it('should show the connect prompt and redirect to auth on sign-in', () => {
      render(<CreatorsHomePage />)
      expect(screen.getByText('page.creators.home.not_connected_title')).toBeInTheDocument()
      fireEvent.click(screen.getByText('page.creators.home.sign_in'))
      expect(mockRedirectToAuth).toHaveBeenCalledWith('/creators')
    })
  })

  describe('when names are still loading', () => {
    it('should render the skeleton grid', () => {
      mockNames = { data: undefined, isLoading: true }
      render(<CreatorsHomePage />)
      expect(screen.getByLabelText('page.creators.home.loading')).toBeInTheDocument()
    })
  })

  describe('when contributable domains are still loading', () => {
    it('should render the skeleton grid', () => {
      mockDomains = { data: undefined, isLoading: true }
      render(<CreatorsHomePage />)
      expect(screen.getByLabelText('page.creators.home.loading')).toBeInTheDocument()
    })
  })

  describe('when there are no worlds', () => {
    it('should show the empty state', () => {
      mockMerged = []
      render(<CreatorsHomePage />)
      expect(screen.getByText('page.creators.home.empty_title')).toBeInTheDocument()
    })
  })

  describe('when worlds are present', () => {
    it('should render one card per world and navigate on selection', () => {
      render(<CreatorsHomePage />)
      const card = screen.getByText(/^world:world.dcl.eth/)
      expect(card).toBeInTheDocument()
      fireEvent.click(card)
      expect(mockNavigate).toHaveBeenCalledWith('/creators/world/world.dcl.eth')
    })

    it('should enrich cards with thumbnail + live user count from the discover query', () => {
      mockEnrichment = {
        data: [{ world_name: 'World.DCL.eth', image: 'https://cdn/thumb.png', user_count: 7 }]
      }
      render(<CreatorsHomePage />)
      expect(screen.getByText('world:world.dcl.eth:https://cdn/thumb.png:7')).toBeInTheDocument()
    })

    it('should leave a world unenriched when no matching place is returned', () => {
      mockEnrichment = { data: [{ world_name: 'other.dcl.eth', image: 'x', user_count: 1 }] }
      render(<CreatorsHomePage />)
      expect(screen.getByText('world:world.dcl.eth:no-thumb:no-live')).toBeInTheDocument()
    })
  })
})
