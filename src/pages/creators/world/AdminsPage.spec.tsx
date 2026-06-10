import { fireEvent, render, screen } from '@testing-library/react'
import type { SceneAdmin } from '../../../features/sceneGatekeeper'

let mockContext: { worldName: string; deployments: unknown[]; latest: unknown; place: unknown }
let mockIdentity: unknown

const mockUseGetAdmins = jest.fn()
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
jest.mock('../../../features/sceneGatekeeper', () => ({
  useGetSceneAdminsQuery: (...a: unknown[]) => mockUseGetAdmins(...a),
  useAddSceneAdminMutation: () => [mockAdd, mockAddState],
  useRemoveSceneAdminMutation: () => [mockRemove, mockRemoveState]
}))

// Imported after the mocks so the mocked barrels win.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AdminsPage } = require('./AdminsPage') as typeof import('./AdminsPage')

const LATEST = { entityId: 'e1', baseParcel: '0,0' }

function makeAdmin(overrides: Partial<SceneAdmin> = {}): SceneAdmin {
  return { admin: '0x1111111111111111111111111111111111111111', name: '', canBeRemoved: true, ...overrides }
}

describe('AdminsPage', () => {
  beforeEach(() => {
    mockContext = { worldName: 'test.dcl.eth', deployments: [], latest: LATEST, place: null }
    mockIdentity = { authChain: [] }
    mockAddState = { isLoading: false, isError: false }
    mockRemoveState = { isLoading: false, isError: false }
    mockAdd.mockImplementation(() => Object.assign(Promise.resolve({}), { unwrap: () => Promise.resolve({}) }))
    mockRemove.mockImplementation(() => Object.assign(Promise.resolve({}), { unwrap: () => Promise.resolve({}) }))
    mockUseGetAdmins.mockReturnValue({ data: [], isLoading: false, isError: false })
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should ask the user to sign in when there is no identity', () => {
    mockIdentity = undefined
    render(<AdminsPage />)
    expect(screen.getByText('page.creators.world.admins_sign_in')).toBeInTheDocument()
  })

  it('should explain there is no deployment when latest is missing', () => {
    mockContext = { ...mockContext, latest: null }
    render(<AdminsPage />)
    expect(screen.getByText('page.creators.world.admins_no_deployment')).toBeInTheDocument()
  })

  it('should show a spinner while admins load', () => {
    mockUseGetAdmins.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    render(<AdminsPage />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should surface a load error', () => {
    mockUseGetAdmins.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    render(<AdminsPage />)
    expect(screen.getByText('page.creators.world.admins_load_error')).toBeInTheDocument()
  })

  it('should render the empty state when the world has no admins', () => {
    mockUseGetAdmins.mockReturnValue({ data: [], isLoading: false, isError: false })
    render(<AdminsPage />)
    expect(screen.getByText('page.creators.world.admins_empty')).toBeInTheDocument()
  })

  it('should list admins with their address and name', () => {
    mockUseGetAdmins.mockReturnValue({
      data: [makeAdmin({ admin: '0x2222222222222222222222222222222222222222', name: 'Alice' })],
      isLoading: false,
      isError: false
    })
    render(<AdminsPage />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('0x2222222222222222222222222222222222222222')).toBeInTheDocument()
  })

  it('should add an admin by address when the value is address-shaped', async () => {
    render(<AdminsPage />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01' } })
    fireEvent.click(screen.getByRole('button', { name: 'page.creators.world.admins_add' }))
    await Promise.resolve()
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ admin: '0xabcdef0123456789abcdef0123456789abcdef01' }))
  })

  it('should add an admin by name when the value is not address-shaped', async () => {
    render(<AdminsPage />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'cooluser' } })
    fireEvent.click(screen.getByRole('button', { name: 'page.creators.world.admins_add' }))
    await Promise.resolve()
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ name: 'cooluser' }))
  })

  it('should add an admin when pressing Enter in the input', async () => {
    render(<AdminsPage />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'enteruser' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await Promise.resolve()
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ name: 'enteruser' }))
  })

  it('should ignore whitespace-only input on add', () => {
    render(<AdminsPage />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } })
    const addButton = screen.getByRole('button', { name: 'page.creators.world.admins_add' })
    fireEvent.click(addButton)
    expect(mockAdd).not.toHaveBeenCalled()
  })

  it('should remove an admin that can be removed', () => {
    mockUseGetAdmins.mockReturnValue({
      data: [makeAdmin({ admin: '0x3333333333333333333333333333333333333333', canBeRemoved: true })],
      isLoading: false,
      isError: false
    })
    render(<AdminsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'page.creators.world.admins_remove' }))
    expect(mockRemove).toHaveBeenCalledWith(expect.objectContaining({ admin: '0x3333333333333333333333333333333333333333' }))
  })

  it('should swallow a rejected remove and still derive the scope without a base parcel', () => {
    mockContext = { ...mockContext, latest: { entityId: 'e1' } }
    mockRemove.mockImplementation(() => Promise.reject(new Error('boom')))
    mockUseGetAdmins.mockReturnValue({
      data: [makeAdmin({ admin: '0x4444444444444444444444444444444444444444', canBeRemoved: true })],
      isLoading: false,
      isError: false
    })
    render(<AdminsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'page.creators.world.admins_remove' }))
    expect(mockRemove).toHaveBeenCalledWith(expect.objectContaining({ parcel: '0,0' }))
  })

  it('should render the implicit tag for admins that cannot be removed', () => {
    mockUseGetAdmins.mockReturnValue({
      data: [makeAdmin({ canBeRemoved: false })],
      isLoading: false,
      isError: false
    })
    render(<AdminsPage />)
    expect(screen.getByText('page.creators.world.admins_implicit')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'page.creators.world.admins_remove' })).not.toBeInTheDocument()
  })

  it('should surface the add error helper when the add mutation failed', () => {
    mockAddState = { isLoading: false, isError: true }
    render(<AdminsPage />)
    expect(screen.getByText('page.creators.world.admins_error')).toBeInTheDocument()
  })
})
