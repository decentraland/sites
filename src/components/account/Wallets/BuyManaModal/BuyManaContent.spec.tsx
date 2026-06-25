import type { ReactNode } from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { BuyManaContent } from './BuyManaContent'

const mockGetMoonPayUrl = jest.fn()
const mockFetchTransakUrl = jest.fn()

jest.mock('../buyMana.helpers', () => ({
  getMoonPayUrl: (address: string) => mockGetMoonPayUrl(address),
  fetchTransakUrl: (network: string, address: string) => mockFetchTransakUrl(network, address)
}))

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

type ButtonProps = { children?: ReactNode; onClick?: () => void; disabled?: boolean; 'data-role'?: string }

jest.mock('decentraland-ui2', () => ({
  Button: ({ children, onClick, disabled, 'data-role': dataRole }: ButtonProps) => (
    <button type="button" onClick={onClick} disabled={disabled} data-role={dataRole}>
      {children}
    </button>
  )
}))

type ChildrenRole = { children?: ReactNode; 'data-role'?: string }

jest.mock('../SendManaModal/SendManaModal.styled', () => ({
  Body: ({ children, 'data-role': dataRole }: ChildrenRole) => <div data-role={dataRole}>{children}</div>,
  StateText: ({ children }: ChildrenRole) => <span data-role="buy-error">{children}</span>
}))

jest.mock('./BuyManaModal.styled', () => ({
  Subtitle: ({ children }: ChildrenRole) => <p>{children}</p>,
  NetworkSection: ({ children, 'data-role': dataRole }: ChildrenRole) => <section data-role={dataRole}>{children}</section>,
  NetworkLabel: ({ children }: ChildrenRole) => <h3>{children}</h3>,
  NetworkDescription: ({ children }: ChildrenRole) => <p>{children}</p>,
  GatewayCard: ({ children, 'data-role': dataRole }: ChildrenRole) => <div data-role={dataRole}>{children}</div>,
  GatewayTitle: ({ children }: ChildrenRole) => <h4>{children}</h4>,
  GatewaySubtitle: ({ children }: ChildrenRole) => <p>{children}</p>,
  LearnMore: ({ children, href }: ChildrenRole & { href?: string }) => <a href={href}>{children}</a>
}))

const click = (container: HTMLElement, role: string) => fireEvent.click(container.querySelector(`[data-role="${role}"]`) as Element)

describe('BuyManaContent', () => {
  let openSpy: jest.SpyInstance
  let tab: { opener: unknown; location: { href: string }; close: jest.Mock }

  beforeEach(() => {
    tab = { opener: {}, location: { href: '' }, close: jest.fn() }
    openSpy = jest.spyOn(window, 'open').mockImplementation(() => tab as unknown as Window)
    mockGetMoonPayUrl.mockReturnValue('https://buy.moonpay.test/checkout')
    mockFetchTransakUrl.mockResolvedValue('https://global.transak.test/widget')
  })

  afterEach(() => {
    jest.clearAllMocks()
    openSpy.mockRestore()
  })

  it('should render an Ethereum section (MoonPay + Transak) and a Polygon section (Transak only)', () => {
    const { container } = render(<BuyManaContent address="0xUSER" onClose={jest.fn()} />)

    expect(container.querySelector('[data-role="buy-network-ethereum"]')).toBeInTheDocument()
    expect(container.querySelector('[data-role="buy-network-polygon"]')).toBeInTheDocument()
    expect(container.querySelector('[data-role="buy-gateway-ethereum-moonpay"]')).toBeInTheDocument()
    expect(container.querySelector('[data-role="buy-gateway-ethereum-transak"]')).toBeInTheDocument()
    expect(container.querySelector('[data-role="buy-gateway-polygon-transak"]')).toBeInTheDocument()
    // MoonPay is not offered on Polygon
    expect(container.querySelector('[data-role="buy-gateway-polygon-moonpay"]')).not.toBeInTheDocument()
  })

  it('should open the MoonPay hosted checkout synchronously and close', () => {
    const onClose = jest.fn()
    const { container } = render(<BuyManaContent address="0xUSER" onClose={onClose} />)

    click(container, 'buy-continue-ethereum-moonpay')

    expect(mockGetMoonPayUrl).toHaveBeenCalledWith('0xUSER')
    expect(openSpy).toHaveBeenCalledWith('https://buy.moonpay.test/checkout', '_blank', 'noopener,noreferrer')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should open a blank tab synchronously and point it at the fetched Transak url', async () => {
    const onClose = jest.fn()
    const { container } = render(<BuyManaContent address="0xUSER" onClose={onClose} />)

    click(container, 'buy-continue-polygon-transak')

    // tab opened synchronously (before the await) so the popup blocker can't kill it
    expect(openSpy).toHaveBeenCalledWith('about:blank', '_blank')
    await waitFor(() => expect(tab.location.href).toBe('https://global.transak.test/widget'))
    expect(mockFetchTransakUrl).toHaveBeenCalledWith('polygon', '0xUSER')
    expect(tab.opener).toBeNull()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should close the blank tab and show a stable error when Transak fails', async () => {
    mockFetchTransakUrl.mockRejectedValue(new Error('boom'))
    const { container } = render(<BuyManaContent address="0xUSER" onClose={jest.fn()} />)

    click(container, 'buy-continue-ethereum-transak')

    await waitFor(() => expect(container.querySelector('[data-role="buy-error"]')?.textContent).toBe('account.wallets.buy.error'))
    expect(tab.close).toHaveBeenCalledTimes(1)
  })

  it('should do nothing without an address', () => {
    const { container } = render(<BuyManaContent address={undefined} onClose={jest.fn()} />)

    click(container, 'buy-continue-ethereum-moonpay')

    expect(mockGetMoonPayUrl).not.toHaveBeenCalled()
    expect(openSpy).not.toHaveBeenCalled()
  })
})
