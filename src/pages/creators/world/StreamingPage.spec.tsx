import { act, fireEvent, render, screen } from '@testing-library/react'

let mockContext: { worldName: string; deployments: unknown[]; latest: unknown; place: unknown }
let mockIdentity: unknown

const mockUseGetStream = jest.fn()
const mockCreate = jest.fn(() => Object.assign(Promise.resolve({}), { unwrap: () => Promise.resolve({}) }))
const mockReset = jest.fn(() => Object.assign(Promise.resolve({}), { unwrap: () => Promise.resolve({}) }))
const mockRevoke = jest.fn(() => Object.assign(Promise.resolve({}), { unwrap: () => Promise.resolve({}) }))
let mockCreateState: { isLoading: boolean; isError: boolean }
let mockResetState: { isLoading: boolean; isError: boolean }
let mockRevokeState: { isLoading: boolean; isError: boolean }

jest.mock('../../../components/creators/CreatorWorldLayout', () => ({ useWorldContext: () => mockContext }))
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({ useFormatMessage: () => (id: string) => id }))
jest.mock('../../../hooks/useBlogPageTracking', () => ({ useBlogPageTracking: () => undefined }))
jest.mock('../../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => ({ identity: mockIdentity, hasValidIdentity: !!mockIdentity, address: '0xowner' })
}))
jest.mock('react-helmet-async', () => ({ Helmet: ({ children }: { children?: React.ReactNode }) => <>{children}</> }))
jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/creatorsUi2Mock'))
jest.mock('../../../features/sceneGatekeeper', () => ({
  useGetSceneStreamQuery: (...a: unknown[]) => mockUseGetStream(...a),
  useCreateSceneStreamMutation: () => [mockCreate, mockCreateState],
  useResetSceneStreamMutation: () => [mockReset, mockResetState],
  useRevokeSceneStreamMutation: () => [mockRevoke, mockRevokeState]
}))

// Imported after the mocks so the mocked barrels win.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { StreamingPage } = require('./StreamingPage') as typeof import('./StreamingPage')

describe('StreamingPage', () => {
  beforeEach(() => {
    mockContext = {
      worldName: 'test.dcl.eth',
      deployments: [],
      latest: { entityId: 'bafy123', baseParcel: '0,0' },
      place: null
    }
    mockIdentity = { authChain: [] }
    mockCreateState = { isLoading: false, isError: false }
    mockResetState = { isLoading: false, isError: false }
    mockRevokeState = { isLoading: false, isError: false }
    mockUseGetStream.mockReturnValue({ data: undefined, isLoading: false, isError: false })
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should show the sign-in hint when no identity is present', () => {
    mockIdentity = null
    render(<StreamingPage />)
    expect(screen.getByText('page.creators.world.streaming_sign_in')).toBeInTheDocument()
  })

  it('should show the no-deployment hint when the world has no latest deployment', () => {
    mockContext.latest = null
    render(<StreamingPage />)
    expect(screen.getByText('page.creators.world.streaming_no_deployment')).toBeInTheDocument()
  })

  it('should show a spinner while the stream access loads', () => {
    mockUseGetStream.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    render(<StreamingPage />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should surface a load error', () => {
    mockUseGetStream.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    render(<StreamingPage />)
    expect(screen.getByText('page.creators.world.streaming_load_error')).toBeInTheDocument()
  })

  it('should render the empty state with a generate button and trigger creation', () => {
    mockUseGetStream.mockReturnValue({ data: null, isLoading: false, isError: false })
    render(<StreamingPage />)
    expect(screen.getByText('page.creators.world.streaming_none')).toBeInTheDocument()
    fireEvent.click(screen.getByText('page.creators.world.streaming_generate'))
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('should render access details with url, key, expiry and action buttons', () => {
    mockUseGetStream.mockReturnValue({
      data: { streaming_url: 'rtmp://ingest.example', streaming_key: 'sk_secret', ends_at: 1893456000 },
      isLoading: false,
      isError: false
    })
    render(<StreamingPage />)
    expect(screen.getByText('rtmp://ingest.example')).toBeInTheDocument()
    expect(screen.getByText('sk_secret')).toBeInTheDocument()
    expect(screen.getByText(/page\.creators\.world\.streaming_expires/)).toBeInTheDocument()

    // GhostButton (styled(Button) → div) — query by text.
    fireEvent.click(screen.getByText('page.creators.world.streaming_reset'))
    expect(mockReset).toHaveBeenCalledTimes(1)

    // Revoke uses the plain Button mock (real <button>).
    fireEvent.click(screen.getByText('page.creators.world.streaming_revoke'))
    expect(mockRevoke).toHaveBeenCalledTimes(1)
  })

  it('should not render the expiry line when ends_at is absent', () => {
    mockUseGetStream.mockReturnValue({
      data: { streaming_url: 'rtmp://ingest.example', streaming_key: 'sk_secret' },
      isLoading: false,
      isError: false
    })
    render(<StreamingPage />)
    expect(screen.queryByText(/page\.creators\.world\.streaming_expires/)).not.toBeInTheDocument()
  })

  it('should copy the url to the clipboard, show the copied state, then reset it', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    // Capture the reset-timeout callback so we can fire it synchronously instead
    // of waiting on a real timer.
    let timeoutCb: (() => void) | undefined
    const setTimeoutSpy = jest.spyOn(window, 'setTimeout').mockImplementation((cb: TimerHandler) => {
      timeoutCb = cb as () => void
      return 0 as unknown as ReturnType<typeof setTimeout>
    })
    mockUseGetStream.mockReturnValue({
      data: { streaming_url: 'rtmp://ingest.example', streaming_key: 'sk_secret', ends_at: 1893456000 },
      isLoading: false,
      isError: false
    })
    render(<StreamingPage />)
    fireEvent.click(screen.getAllByText('page.creators.world.streaming_copy')[0])
    expect(writeText).toHaveBeenCalledWith('rtmp://ingest.example')

    // Flush the writeText promise so setCopied('url') runs, flipping to the copied label.
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(screen.getByText('page.creators.world.streaming_copied')).toBeInTheDocument()

    // Fire the scheduled timeout to clear the copied state.
    act(() => {
      timeoutCb?.()
    })
    expect(screen.queryByText('page.creators.world.streaming_copied')).not.toBeInTheDocument()
    setTimeoutSpy.mockRestore()
  })

  it('should copy the streaming key to the clipboard', () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    mockUseGetStream.mockReturnValue({
      data: { streaming_url: 'rtmp://ingest.example', streaming_key: 'sk_secret' },
      isLoading: false,
      isError: false
    })
    render(<StreamingPage />)
    fireEvent.click(screen.getAllByText('page.creators.world.streaming_copy')[1])
    expect(writeText).toHaveBeenCalledWith('sk_secret')
  })

  it('should swallow a failed clipboard write without flipping to the copied state', async () => {
    const writeText = jest.fn().mockRejectedValue(new Error('denied'))
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    mockUseGetStream.mockReturnValue({
      data: { streaming_url: 'rtmp://ingest.example', streaming_key: 'sk_secret' },
      isLoading: false,
      isError: false
    })
    render(<StreamingPage />)
    fireEvent.click(screen.getAllByText('page.creators.world.streaming_copy')[0])
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(screen.queryByText('page.creators.world.streaming_copied')).not.toBeInTheDocument()
  })
})
