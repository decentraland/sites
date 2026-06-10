import { render, screen } from '@testing-library/react'

jest.mock('react-helmet-async', () => ({ Helmet: ({ children }: { children?: React.ReactNode }) => <>{children}</> }))
jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/creatorsUi2Mock'))

// Imported after the mocks so the mocked barrels win.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ComingSoon } = require('./ComingSoon') as typeof import('./ComingSoon')

describe('ComingSoon', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render the title, soon badge and hint', () => {
    render(<ComingSoon title="My Title" soonLabel="Soon" hint="A hint" tileLabels={['a', 'b']} documentTitle="Doc" />)
    expect(screen.getByText('My Title')).toBeInTheDocument()
    expect(screen.getByText('Soon')).toBeInTheDocument()
    expect(screen.getByText('A hint')).toBeInTheDocument()
  })

  it('should render one tile per label, each with a dash value', () => {
    render(<ComingSoon title="T" soonLabel="S" hint="H" tileLabels={['Visits', 'Players']} documentTitle="D" />)
    expect(screen.getByText('Visits')).toBeInTheDocument()
    expect(screen.getByText('Players')).toBeInTheDocument()
    expect(screen.getAllByText('—')).toHaveLength(2)
  })
})
