import { fireEvent, render, screen } from '@testing-library/react'
import type { SceneBan } from '../../../features/bans'

let mockContext: { worldName: string; deployments: unknown[]; latest: unknown; place: unknown }
let mockIdentity: unknown

const mockUseGetBans = jest.fn()
const mockAdd = jest.fn()
const mockRemove = jest.fn()
let mockAddState: { isLoading: boolean; isError: boolean }
let mockRemoveState: { isLoading: boolean; isError: boolean }

jest.mock('../../../components/creators/CreatorWorldLayout', () => ({ useWorldContext: () => mockContext }))
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({ useFormatMessage: () => (id: string) => id }))
jest.mock('../../../hooks/useBlogPageTracking', () => ({ useBlogPageTracking: () => undefined }))
jest.mock('../../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => ({ identity: mockIdentity, hasValidIdentity: !!mockIdentity, address: '0xowner' })
}))
jest.mock('react-helmet-async', () => ({ Helmet: ({ children }: { children?: React.ReactNode }) => <>{children}</> }))
jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/creatorsUi2Mock'))
jest.mock('../../../features/bans', () => ({
  useGetSceneBansQuery: (...a: unknown[]) => mockUseGetBans(...a),
  useAddSceneBanMutation: () => [mockAdd, mockAddState],
  useRemoveSceneBanMutation: () => [mockRemove, mockRemoveState]
}))

// Imported after the mocks so the mocked barrels win.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { BansPage } = require('./BansPage') as typeof import('./BansPage')

const LATEST = { entityId: 'e1', baseParcel: '0,0' }

function makeBan(overrides: Partial<SceneBan> = {}): SceneBan {
  return { bannedAddress: '0x1111111111111111111111111111111111111111', name: '', ...overrides }
}

describe('BansPage', () => {
  beforeEach(() => {
    mockContext = { worldName: 'test.dcl.eth', deployments: [], latest: LATEST, place: null }
    mockIdentity = { authChain: [] }
    mockAddState = { isLoading: false, isError: false }
    mockRemoveState = { isLoading: false, isError: false }
    mockAdd.mockImplementation(() => Object.assign(Promise.resolve({}), { unwrap: () => Promise.resolve({}) }))
    mockRemove.mockImplementation(() => Object.assign(Promise.resolve({}), { unwrap: () => Promise.resolve({}) }))
    mockUseGetBans.mockReturnValue({ data: { results: [] }, isLoading: false, isError: false })
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should ask the user to sign in when there is no identity', () => {
    mockIdentity = undefined
    render(<BansPage />)
    expect(screen.getByText('page.creators.world.bans_sign_in')).toBeInTheDocument()
  })

  it('should explain there is no deployment when latest is missing', () => {
    mockContext = { ...mockContext, latest: null }
    render(<BansPage />)
    expect(screen.getByText('page.creators.world.bans_no_deployment')).toBeInTheDocument()
  })

  it('should show a spinner while bans load', () => {
    mockUseGetBans.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    render(<BansPage />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should surface a load error', () => {
    mockUseGetBans.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    render(<BansPage />)
    expect(screen.getByText('page.creators.world.bans_load_error')).toBeInTheDocument()
  })

  it('should render the empty state when the world has no bans', () => {
    mockUseGetBans.mockReturnValue({ data: { results: [] }, isLoading: false, isError: false })
    render(<BansPage />)
    expect(screen.getByText('page.creators.world.bans_empty')).toBeInTheDocument()
  })

  it('should list bans with their address and name', () => {
    mockUseGetBans.mockReturnValue({
      data: { results: [makeBan({ bannedAddress: '0x2222222222222222222222222222222222222222', name: 'Bob' })] },
      isLoading: false,
      isError: false
    })
    render(<BansPage />)
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('0x2222222222222222222222222222222222222222')).toBeInTheDocument()
  })

  it('should add a ban by address when the value is address-shaped', async () => {
    render(<BansPage />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01' } })
    fireEvent.click(screen.getByRole('button', { name: 'page.creators.world.bans_add' }))
    await Promise.resolve()
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ address: '0xabcdef0123456789abcdef0123456789abcdef01' }))
  })

  it('should add a ban by name when the value is not address-shaped', async () => {
    render(<BansPage />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'baduser' } })
    fireEvent.click(screen.getByRole('button', { name: 'page.creators.world.bans_add' }))
    await Promise.resolve()
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ name: 'baduser' }))
  })

  it('should add a ban when pressing Enter in the input', async () => {
    render(<BansPage />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'enterban' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await Promise.resolve()
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ name: 'enterban' }))
  })

  it('should ignore whitespace-only input on add', () => {
    render(<BansPage />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'page.creators.world.bans_add' }))
    expect(mockAdd).not.toHaveBeenCalled()
  })

  it('should unban by address when the ban has an address', () => {
    mockUseGetBans.mockReturnValue({
      data: { results: [makeBan({ bannedAddress: '0x3333333333333333333333333333333333333333' })] },
      isLoading: false,
      isError: false
    })
    render(<BansPage />)
    fireEvent.click(screen.getByRole('button', { name: 'page.creators.world.bans_unban' }))
    expect(mockRemove).toHaveBeenCalledWith(expect.objectContaining({ address: '0x3333333333333333333333333333333333333333' }))
  })

  it('should swallow a rejected unban and still derive the scope without a base parcel', () => {
    mockContext = { ...mockContext, latest: { entityId: 'e1' } }
    mockRemove.mockImplementation(() => Promise.reject(new Error('boom')))
    mockUseGetBans.mockReturnValue({
      data: { results: [makeBan({ bannedAddress: '0x4444444444444444444444444444444444444444' })] },
      isLoading: false,
      isError: false
    })
    render(<BansPage />)
    fireEvent.click(screen.getByRole('button', { name: 'page.creators.world.bans_unban' }))
    expect(mockRemove).toHaveBeenCalledWith(expect.objectContaining({ parcel: '0,0' }))
  })

  it('should fall back to the name when unbanning a ban with an empty address', () => {
    mockUseGetBans.mockReturnValue({
      data: { results: [makeBan({ bannedAddress: '', name: 'NamedOnly' })] },
      isLoading: false,
      isError: false
    })
    render(<BansPage />)
    fireEvent.click(screen.getByRole('button', { name: 'page.creators.world.bans_unban' }))
    expect(mockRemove).toHaveBeenCalledWith(expect.objectContaining({ name: 'NamedOnly' }))
  })

  it('should surface the add error helper when the add mutation failed', () => {
    mockAddState = { isLoading: false, isError: true }
    render(<BansPage />)
    expect(screen.getByText('page.creators.world.bans_error')).toBeInTheDocument()
  })
})
