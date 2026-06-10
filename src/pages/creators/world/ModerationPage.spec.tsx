import { fireEvent, render, screen } from '@testing-library/react'

let mockContext: { worldName: string; deployments: unknown[]; latest: unknown; place: unknown }

jest.mock('../../../components/creators/CreatorWorldLayout', () => ({ useWorldContext: () => mockContext }))
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({ useFormatMessage: () => (id: string) => id }))
jest.mock('../../../hooks/useBlogPageTracking', () => ({ useBlogPageTracking: () => undefined }))
jest.mock('react-helmet-async', () => ({ Helmet: ({ children }: { children?: React.ReactNode }) => <>{children}</> }))
jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/creatorsUi2Mock'))
jest.mock('./SceneAdminsPanel', () => ({ SceneAdminsPanel: () => <div data-testid="admins-panel" /> }))
jest.mock('./BansPanel', () => ({ BansPanel: () => <div data-testid="bans-panel" /> }))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ModerationPage } = require('./ModerationPage') as typeof import('./ModerationPage')

describe('ModerationPage', () => {
  beforeEach(() => {
    mockContext = { worldName: 'test.dcl.eth', deployments: [], latest: null, place: null }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should default to the scene admins sub-tab', () => {
    render(<ModerationPage />)
    expect(screen.getByText('page.creators.world.nav.moderation')).toBeInTheDocument()
    expect(screen.getByTestId('admins-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('bans-panel')).not.toBeInTheDocument()
  })

  it('should switch to the bans sub-tab when its tab is selected', () => {
    render(<ModerationPage />)
    fireEvent.click(screen.getByRole('tab', { name: 'page.creators.world.nav.bans' }))
    expect(screen.getByTestId('bans-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('admins-panel')).not.toBeInTheDocument()
  })
})
