import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import type { WalletTransaction } from '../../../../hooks/useWalletTransactions.types'
import { BalanceCard } from './BalanceCard'

type ChildrenProps = { children?: ReactNode }
type ButtonProps = ChildrenProps & { onClick?: () => void; 'data-role'?: string }

jest.mock('@mui/icons-material/AttachMoneyRounded', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/ArrowUpwardRounded', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/ArrowDownwardRounded', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/SwapHorizRounded', () => ({ __esModule: true, default: () => <span /> }))

jest.mock('decentraland-ui2', () => ({
  Skeleton: () => <span data-testid="skeleton" />
}))

jest.mock('../../../LandingNavbar/icons', () => ({
  ManaEthIcon: () => <span data-testid="mana-eth" />,
  ManaMaticIcon: () => <span data-testid="mana-matic" />
}))

jest.mock('../ManaMarkIcon', () => ({
  ManaMarkIcon: () => <span data-testid="mana-mark" />
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
  formatMana: (value: number) => `formatted-${value}`
}))

jest.mock('../TransactionsSection/TransactionsSection', () => ({
  TransactionsSection: () => <div data-testid="transactions-section" />
}))

jest.mock('./BalanceCard.styled', () => ({
  Card: ({ children }: ChildrenProps) => <div>{children}</div>,
  CardTop: ({ children }: ChildrenProps) => <div>{children}</div>,
  BalanceInfo: ({ children }: ChildrenProps) => <div>{children}</div>,
  NetworkRow: ({ children }: ChildrenProps) => <div>{children}</div>,
  NetworkLabel: ({ children }: ChildrenProps) => <div>{children}</div>,
  BalanceRow: ({ children }: ChildrenProps) => <div>{children}</div>,
  BalanceAmount: ({ children }: ChildrenProps) => <div>{children}</div>,
  Actions: ({ children }: ChildrenProps) => <div>{children}</div>,
  ActionButton: ({ children, onClick, 'data-role': dataRole }: ButtonProps) => (
    <button type="button" data-role={dataRole} onClick={onClick}>
      {children}
    </button>
  )
}))

type RenderOverrides = {
  network?: 'ethereum' | 'polygon'
  balance?: number
  isLoading?: boolean
  transactions?: WalletTransaction[]
  onReceive?: () => void
  onSend?: () => void
  onSwap?: () => void
  onBuy?: () => void
}

const renderCard = (overrides: RenderOverrides = {}) =>
  render(
    <BalanceCard
      network={overrides.network ?? 'ethereum'}
      balance={overrides.balance ?? 1}
      isLoading={overrides.isLoading ?? false}
      transactions={overrides.transactions ?? []}
      onReceive={overrides.onReceive ?? jest.fn()}
      onSend={overrides.onSend ?? jest.fn()}
      onSwap={overrides.onSwap ?? jest.fn()}
      onBuy={overrides.onBuy ?? jest.fn()}
    />
  )

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
    renderCard({ network: 'ethereum', balance: 100595 })

    expect(screen.getByText('account.wallets.eth_label')).toBeInTheDocument()
    expect(screen.getByText('formatted-100595')).toBeInTheDocument()
    expect(screen.getByTestId('mana-eth')).toBeInTheDocument()
  })

  it('should show a skeleton while loading or before the balance resolves', () => {
    renderCard({ network: 'polygon', balance: undefined, isLoading: true })

    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })

  it('should invoke onBuy (open the fiat modal) instead of navigating when Buy is clicked', () => {
    const onBuy = jest.fn()
    renderCard({ network: 'ethereum', onBuy })

    fireEvent.click(screen.getByText('account.wallets.actions.buy'))

    expect(onBuy).toHaveBeenCalledTimes(1)
    expect(openSpy).not.toHaveBeenCalled()
    expect(mockTrack).toHaveBeenCalledWith('Click', expect.objectContaining({ action: 'buy', network: 'ethereum' }))
  })

  it('should invoke onReceive instead of navigating when Receive is clicked', () => {
    const onReceive = jest.fn()
    renderCard({ onReceive })

    fireEvent.click(screen.getByText('account.wallets.actions.receive'))

    expect(onReceive).toHaveBeenCalledTimes(1)
    expect(openSpy).not.toHaveBeenCalled()
  })

  it('should invoke onSend in-page instead of deep-linking when Send is clicked', () => {
    const onSend = jest.fn()
    renderCard({ network: 'polygon', onSend })

    fireEvent.click(screen.getByText('account.wallets.actions.send'))

    expect(onSend).toHaveBeenCalledTimes(1)
    expect(openSpy).not.toHaveBeenCalled()
    expect(mockTrack).toHaveBeenCalledWith('Click', expect.objectContaining({ action: 'send', network: 'polygon' }))
  })

  it('should invoke onSwap in-page instead of deep-linking when Swap is clicked', () => {
    const onSwap = jest.fn()
    renderCard({ network: 'ethereum', onSwap })

    fireEvent.click(screen.getByText('account.wallets.actions.swap'))

    expect(onSwap).toHaveBeenCalledTimes(1)
    expect(openSpy).not.toHaveBeenCalled()
    expect(mockTrack).toHaveBeenCalledWith('Click', expect.objectContaining({ action: 'swap', network: 'ethereum' }))
  })
})
