import { render, screen } from '@testing-library/react'

let mockContext: { worldName: string; deployments: unknown[]; latest: unknown; place: unknown }

jest.mock('../../../components/creators/CreatorWorldLayout', () => ({ useWorldContext: () => mockContext }))
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({ useFormatMessage: () => (id: string) => id }))
jest.mock('react-helmet-async', () => ({ Helmet: ({ children }: { children?: React.ReactNode }) => <>{children}</> }))
jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/creatorsUi2Mock'))

// Imported after the mocks so the mocked barrels win.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AnalyticsPage } = require('./AnalyticsPage') as typeof import('./AnalyticsPage')

describe('AnalyticsPage', () => {
  beforeEach(() => {
    mockContext = { worldName: 'test.dcl.eth', deployments: [], latest: null, place: null }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render the coming-soon placeholder with the soon badge and a tile label', () => {
    render(<AnalyticsPage />)
    expect(screen.getByText('page.creators.world.soon')).toBeInTheDocument()
    expect(screen.getByText('page.creators.world.analytics.visits')).toBeInTheDocument()
    expect(screen.getByText('page.creators.world.nav.analytics')).toBeInTheDocument()
  })
})
