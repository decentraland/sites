import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { BalanceCard } from './BalanceCard'

type ChildrenProps = { children?: ReactNode }
type ButtonProps = ChildrenProps & { onClick?: () => void; 'data-role'?: string }

jest.mock('@mui/icons-material/AddRounded', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/NorthEastRounded', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/QrCode2Rounded', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/SwapHorizRounded', () => ({ __esModule: true, default: () => <span /> }))

jest.mock('decentraland-ui2', () => ({
  Skeleton: () => <span data-testid="skeleton" />
}))

jest.mock('../../../LandingNavbar/icons', () => ({
  ManaEthIcon: () => <span data-testid="mana-eth" />,
  ManaMaticIcon: () => <span data-testid="mana-matic" />
}))

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

const mockTrack = jest.fn()
jest.mock('@dcl/hooks', () => ({
  useAnalytics: () => ({ track: mockTrack, isInitialized: true })
}))

jest.mock('../../../../modules/segment', () => ({
  SegmentEvent: { CLICK: 'Click' }
}))

jest.mock('../wallets.helpers', () => ({
  buildBuyManaUrl: () => 'https://market.example.org/buy',
  buildSwapManaUrl: () => 'https://market.example.org/swap',
  buildSendManaUrl: () => 'https://market.example.org/send',
  formatMana: (value: number) => `formatted-${value}`
}))

jest.mock('./BalanceCard.styled', () => ({
  Card: ({ children }: ChildrenProps) => <div>{children}</div>,
  BalanceInfo: ({ children }: ChildrenProps) => <div>{children}</div>,
  NetworkRow: ({ children }: ChildrenProps) => <div>{children}</div>,
  NetworkLabel: ({ children }: ChildrenProps) => <div>{children}</div>,
  BalanceAmount: ({ children }: ChildrenProps) => <div>{children}</div>,
  Actions: ({ children }: ChildrenProps) => <div>{children}</div>,
  ActionButton: ({ children, onClick, 'data-role': dataRole }: ButtonProps) => (
    <button type="button" data-role={dataRole} onClick={onClick}>
      {children}
    </button>
  )
}))

describe('BalanceCard', () => {
  let openSpy: jest.SpyInstance

  beforeEach(() => {
    openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    jest.clearAllMocks()
    openSpy.mockRestore()
  })

  it('should render the network label and the formatted balance', () => {
    render(<BalanceCard network="ethereum" balance={100595} isLoading={false} onReceive={jest.fn()} />)

    expect(screen.getByText('account.wallets.eth_label')).toBeInTheDocument()
    expect(screen.getByText('formatted-100595')).toBeInTheDocument()
    expect(screen.getByTestId('mana-eth')).toBeInTheDocument()
  })

  it('should show a skeleton while loading or before the balance resolves', () => {
    render(<BalanceCard network="polygon" balance={undefined} isLoading onReceive={jest.fn()} />)

    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })

  it('should open the marketplace in a new tab when Buy is clicked', () => {
    render(<BalanceCard network="ethereum" balance={1} isLoading={false} onReceive={jest.fn()} />)

    fireEvent.click(screen.getByText('account.wallets.actions.buy'))

    expect(openSpy).toHaveBeenCalledWith('https://market.example.org/buy', '_blank', 'noopener,noreferrer')
    expect(mockTrack).toHaveBeenCalledWith('Click', expect.objectContaining({ action: 'buy', network: 'ethereum' }))
  })

  it('should invoke onReceive instead of navigating when Receive is clicked', () => {
    const onReceive = jest.fn()
    render(<BalanceCard network="ethereum" balance={1} isLoading={false} onReceive={onReceive} />)

    fireEvent.click(screen.getByText('account.wallets.actions.receive'))

    expect(onReceive).toHaveBeenCalledTimes(1)
    expect(openSpy).not.toHaveBeenCalled()
  })
})
