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

type ImageRole = { src?: string; alt?: string; 'data-role'?: string }
type FrameRole = { src?: string; title?: string; 'data-role'?: string }

jest.mock('./BuyManaModal.styled', () => ({
  Subtitle: ({ children }: ChildrenRole) => <p>{children}</p>,
  NetworkSection: ({ children, 'data-role': dataRole }: ChildrenRole) => <section data-role={dataRole}>{children}</section>,
  NetworkLabel: ({ children }: ChildrenRole) => <h3>{children}</h3>,
  NetworkDescription: ({ children }: ChildrenRole) => <p>{children}</p>,
  GatewayCard: ({ children, 'data-role': dataRole }: ChildrenRole) => <div data-role={dataRole}>{children}</div>,
  GatewayLogo: ({ src, alt, 'data-role': dataRole }: ImageRole) => <img src={src} alt={alt} data-role={dataRole} />,
  GatewayTitle: ({ children }: ChildrenRole) => <h4>{children}</h4>,
  GatewaySubtitle: ({ children }: ChildrenRole) => <p>{children}</p>,
  LearnMore: ({ children, href }: ChildrenRole & { href?: string }) => <a href={href}>{children}</a>,
  TransakFrame: ({ src, title, 'data-role': dataRole }: FrameRole) => <iframe src={src} title={title} data-role={dataRole} />
}))

const click = (container: HTMLElement, role: string) => fireEvent.click(container.querySelector(`[data-role="${role}"]`) as Element)

describe('BuyManaContent', () => {
  let openSpy: jest.SpyInstance

  beforeEach(() => {
    openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
    mockGetMoonPayUrl.mockReturnValue('https://buy.moonpay.test/checkout')
    mockFetchTransakUrl.mockResolvedValue('https://global.transak.test/widget')
  })

  afterEach(() => {
    jest.clearAllMocks()
    openSpy.mockRestore()
  })

  it('should render the Ethereum section with Transak only (MoonPay is temporarily hidden) when the network is ethereum', () => {
    const { container } = render(<BuyManaContent address="0xUSER" network="ethereum" onClose={jest.fn()} />)

    expect(container.querySelector('[data-role="buy-network-ethereum"]')).toBeInTheDocument()
    expect(container.querySelector('[data-role="buy-gateway-ethereum-transak"]')).toBeInTheDocument()
    // MoonPay is temporarily hidden via HIDDEN_PROVIDERS — its gateway card must not render
    expect(container.querySelector('[data-role="buy-gateway-ethereum-moonpay"]')).not.toBeInTheDocument()
    // The Polygon section is not rendered when buying Ethereum MANA
    expect(container.querySelector('[data-role="buy-network-polygon"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-role="buy-gateway-polygon-transak"]')).not.toBeInTheDocument()
  })

  it('should render only the Polygon section (Transak only) when the network is polygon', () => {
    const { container } = render(<BuyManaContent address="0xUSER" network="polygon" onClose={jest.fn()} />)

    expect(container.querySelector('[data-role="buy-network-polygon"]')).toBeInTheDocument()
    expect(container.querySelector('[data-role="buy-gateway-polygon-transak"]')).toBeInTheDocument()
    // The Ethereum section and MoonPay are not rendered when buying Polygon MANA
    expect(container.querySelector('[data-role="buy-network-ethereum"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-role="buy-gateway-polygon-moonpay"]')).not.toBeInTheDocument()
  })

  it('should not render the MoonPay gateway while it is temporarily hidden', () => {
    const { container } = render(<BuyManaContent address="0xUSER" network="ethereum" onClose={jest.fn()} />)

    expect(container.querySelector('[data-role="buy-continue-ethereum-moonpay"]')).not.toBeInTheDocument()
    expect(mockGetMoonPayUrl).not.toHaveBeenCalled()
  })

  it('should render the Transak brand banner on the Transak gateway card', () => {
    const { container } = render(<BuyManaContent address="0xUSER" network="polygon" onClose={jest.fn()} />)

    const logo = container.querySelector('[data-role="buy-logo-polygon-transak"]')
    expect(logo).toBeInTheDocument()
    expect(logo?.getAttribute('src')).toBeTruthy()
  })

  it('should embed the fetched Transak widget url in an in-modal iframe instead of opening a tab', async () => {
    const onClose = jest.fn()
    const { container } = render(<BuyManaContent address="0xUSER" network="polygon" onClose={onClose} />)

    click(container, 'buy-continue-polygon-transak')

    const frame = await waitFor(() => {
      const el = container.querySelector('[data-role="buy-transak-frame"]')
      expect(el).toBeInTheDocument()
      return el
    })
    expect(frame?.getAttribute('src')).toBe('https://global.transak.test/widget')
    expect(mockFetchTransakUrl).toHaveBeenCalledWith('polygon', '0xUSER')
    // The gateway list is replaced by the widget; no new tab is opened and the modal stays open.
    expect(container.querySelector('[data-role="buy-gateway-polygon-transak"]')).not.toBeInTheDocument()
    expect(openSpy).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('should show a stable error and no iframe when fetching the Transak url fails', async () => {
    mockFetchTransakUrl.mockRejectedValue(new Error('boom'))
    const { container } = render(<BuyManaContent address="0xUSER" network="ethereum" onClose={jest.fn()} />)

    click(container, 'buy-continue-ethereum-transak')

    await waitFor(() => expect(container.querySelector('[data-role="buy-error"]')?.textContent).toBe('account.wallets.buy.error'))
    expect(container.querySelector('[data-role="buy-transak-frame"]')).not.toBeInTheDocument()
  })

  it('should do nothing without an address', () => {
    const { container } = render(<BuyManaContent address={undefined} network="ethereum" onClose={jest.fn()} />)

    click(container, 'buy-continue-ethereum-transak')

    expect(mockFetchTransakUrl).not.toHaveBeenCalled()
    expect(openSpy).not.toHaveBeenCalled()
    expect(container.querySelector('[data-role="buy-transak-frame"]')).not.toBeInTheDocument()
  })
})
