import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { ReceiveModal } from './ReceiveModal'

type ChildrenProps = { children?: ReactNode }
type ButtonProps = ChildrenProps & { onClick?: () => void }
type DialogProps = ChildrenProps & { open?: boolean }

jest.mock('@mui/icons-material/CloseRounded', () => ({ __esModule: true, default: () => <span /> }))

jest.mock('decentraland-ui2', () => ({
  Button: ({ children, onClick }: ButtonProps) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  )
}))

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('./ReceiveModal.styled', () => ({
  StyledDialog: ({ open, children }: DialogProps) => (open ? <div role="dialog">{children}</div> : null),
  Header: ({ children }: ChildrenProps) => <div>{children}</div>,
  Title: ({ children }: ChildrenProps) => <div>{children}</div>,
  CloseButton: ({ children, onClick }: ButtonProps) => (
    <button type="button" aria-label="close" onClick={onClick}>
      {children}
    </button>
  ),
  Description: ({ children }: ChildrenProps) => <div>{children}</div>,
  AddressBox: ({ children }: ChildrenProps) => <div>{children}</div>,
  AddressText: ({ children }: ChildrenProps) => <span>{children}</span>
}))

const ADDRESS = '0x1234567890123456789012345678901234567890'

describe('ReceiveModal', () => {
  const writeText = jest.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText } })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should not render anything when closed', () => {
    render(<ReceiveModal open={false} address={ADDRESS} onClose={jest.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render the wallet address when open', () => {
    render(<ReceiveModal open address={ADDRESS} onClose={jest.fn()} />)
    expect(screen.getByText(ADDRESS)).toBeInTheDocument()
  })

  it('should copy the address to the clipboard and confirm', async () => {
    render(<ReceiveModal open address={ADDRESS} onClose={jest.fn()} />)

    fireEvent.click(screen.getByText('account.wallets.receive.copy'))

    expect(writeText).toHaveBeenCalledWith(ADDRESS)
    expect(await screen.findByText('account.wallets.receive.copied')).toBeInTheDocument()
  })

  it('should call onClose when the close button is clicked', () => {
    const onClose = jest.fn()
    render(<ReceiveModal open address={ADDRESS} onClose={onClose} />)

    fireEvent.click(screen.getByLabelText('close'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
