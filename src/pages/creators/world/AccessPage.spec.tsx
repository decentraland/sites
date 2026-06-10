import { fireEvent, render, screen } from '@testing-library/react'
import type { PermissionEntry, WorldPermissions } from '../../../features/worldPermissions/worldPermissions.types'

let mockContext: { worldName: string; deployments: unknown[]; latest: unknown; place: unknown }
let mockIdentity: unknown
let mockNames: Map<string, string | undefined>

const mockUseGetPerms = jest.fn()
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
jest.mock('../../../features/worldPermissions', () => ({
  useGetWorldPermissionsQuery: (...a: unknown[]) => mockUseGetPerms(...a),
  useAddWorldPermissionMutation: () => [mockAdd, mockAddState],
  useRemoveWorldPermissionMutation: () => [mockRemove, mockRemoveState]
}))
jest.mock('../../../features/profile/profile.client', () => ({ useGetProfileNames: () => mockNames }))

// Imported after the mocks so the mocked barrels win.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AccessPage } = require('./AccessPage') as typeof import('./AccessPage')

const PRIVATE_WORLDS_DOCS = 'https://docs.decentraland.org/creator/worlds/about/#access-permissions'

function makePermissions(overrides: Partial<WorldPermissions> = {}): WorldPermissions {
  const empty: PermissionEntry = { type: 'allow-list', wallets: [] }
  return {
    deployment: empty,
    streaming: empty,
    access: empty,
    ...overrides
  }
}

describe('AccessPage', () => {
  beforeEach(() => {
    mockContext = { worldName: 'test.dcl.eth', deployments: [], latest: null, place: null }
    mockIdentity = { authChain: [] }
    mockNames = new Map()
    mockAddState = { isLoading: false, isError: false }
    mockRemoveState = { isLoading: false, isError: false }
    mockAdd.mockImplementation(() => ({ catch: (cb: () => void) => cb() }))
    mockRemove.mockImplementation(() => ({ catch: (cb: () => void) => cb() }))
    mockUseGetPerms.mockReturnValue({ data: { permissions: makePermissions() }, isLoading: false, isError: false })
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should show a spinner while permissions load', () => {
    mockUseGetPerms.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    render(<AccessPage />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should surface a load error when the query errors', () => {
    mockUseGetPerms.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    render(<AccessPage />)
    expect(screen.getByText('page.creators.world.access_load_error')).toBeInTheDocument()
  })

  it('should surface a load error when there is no data', () => {
    mockUseGetPerms.mockReturnValue({ data: undefined, isLoading: false, isError: false })
    render(<AccessPage />)
    expect(screen.getByText('page.creators.world.access_load_error')).toBeInTheDocument()
  })

  it('should render the unrestricted helper and a Learn more link for an unrestricted access permission', () => {
    mockUseGetPerms.mockReturnValue({
      data: { permissions: makePermissions({ access: { type: 'unrestricted', wallets: undefined } }) },
      isLoading: false,
      isError: false
    })
    render(<AccessPage />)
    expect(screen.getByText('page.creators.world.access_unrestricted')).toBeInTheDocument()
    const link = screen.getByText('page.creators.world.access_learn_more').closest('a')
    expect(link).toHaveAttribute('href', PRIVATE_WORLDS_DOCS)
  })

  it('should render the empty state for an allow-list with no wallets', () => {
    render(<AccessPage />)
    expect(screen.getAllByText('page.creators.world.access_empty').length).toBeGreaterThan(0)
  })

  it('should render a wallet row with the name and full address when a name is known', () => {
    mockNames = new Map([['0x1111111111111111111111111111111111111111', 'Alice']])
    mockUseGetPerms.mockReturnValue({
      data: {
        permissions: makePermissions({
          deployment: { type: 'allow-list', wallets: ['0x1111111111111111111111111111111111111111'] }
        })
      },
      isLoading: false,
      isError: false
    })
    render(<AccessPage />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('0x1111111111111111111111111111111111111111')).toBeInTheDocument()
  })

  it('should render only the full address when no name is known', () => {
    mockUseGetPerms.mockReturnValue({
      data: {
        permissions: makePermissions({
          streaming: { type: 'allow-list', wallets: ['0x2222222222222222222222222222222222222222'] }
        })
      },
      isLoading: false,
      isError: false
    })
    render(<AccessPage />)
    expect(screen.getByText('0x2222222222222222222222222222222222222222')).toBeInTheDocument()
  })

  it('should add a wallet when a valid address is entered and Add is clicked', () => {
    render(<AccessPage />)
    const input = screen.getAllByRole('textbox')[0]
    fireEvent.change(input, { target: { value: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01' } })
    const addButton = screen.getAllByRole('button', { name: 'page.creators.world.access_add' })[0]
    fireEvent.click(addButton)
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ address: '0xabcdef0123456789abcdef0123456789abcdef01' }))
  })

  it('should add a wallet when pressing Enter in the input', () => {
    render(<AccessPage />)
    const input = screen.getAllByRole('textbox')[0]
    fireEvent.change(input, { target: { value: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ address: '0xabcdef0123456789abcdef0123456789abcdef01' }))
  })

  it('should not add when the entered value is not address-shaped', () => {
    render(<AccessPage />)
    const input = screen.getAllByRole('textbox')[0]
    fireEvent.change(input, { target: { value: 'not-an-address' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockAdd).not.toHaveBeenCalled()
  })

  it('should remove a wallet when the remove button is clicked', () => {
    mockUseGetPerms.mockReturnValue({
      data: {
        permissions: makePermissions({
          deployment: { type: 'allow-list', wallets: ['0x3333333333333333333333333333333333333333'] }
        })
      },
      isLoading: false,
      isError: false
    })
    render(<AccessPage />)
    const removeButton = screen.getByRole('button', { name: 'page.creators.world.access_remove' })
    fireEvent.click(removeButton)
    expect(mockRemove).toHaveBeenCalledWith(expect.objectContaining({ address: '0x3333333333333333333333333333333333333333' }))
  })

  it('should surface the mutation error helper when an add/remove failed', () => {
    mockAddState = { isLoading: false, isError: true }
    render(<AccessPage />)
    expect(screen.getByText('page.creators.world.access_error')).toBeInTheDocument()
  })

  it('should query with skipToken when there is no world name', () => {
    mockContext = { ...mockContext, worldName: '' }
    render(<AccessPage />)
    expect(mockUseGetPerms).toHaveBeenCalledWith(expect.anything())
  })

  it('should ask the user to sign in and hide the add row when there is no identity', () => {
    mockIdentity = undefined
    render(<AccessPage />)
    expect(screen.getByText('page.creators.world.access_sign_in')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
