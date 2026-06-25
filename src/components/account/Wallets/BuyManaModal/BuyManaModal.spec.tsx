import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { BuyManaModal } from './BuyManaModal'

jest.mock('@mui/icons-material/CloseRounded', () => ({ __esModule: true, default: () => <span /> }))

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('./BuyManaContent', () => ({
  BuyManaContent: ({ address }: { address?: string }) => <div data-testid="buy-content">{address}</div>
}))

jest.mock('../SendManaModal/SendManaModal.styled', () => ({
  StyledDialog: ({ open, children }: { open: boolean; children?: ReactNode }) => (open ? <div>{children}</div> : null),
  Header: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Title: ({ children }: { children?: ReactNode }) => <h2>{children}</h2>,
  CloseButton: ({ children }: { children?: ReactNode }) => <button type="button">{children}</button>
}))

describe('BuyManaModal', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should not render the content while closed', () => {
    render(<BuyManaModal open={false} network="ethereum" address="0xabc" onClose={jest.fn()} />)

    expect(screen.queryByTestId('buy-content')).not.toBeInTheDocument()
  })

  it('should render the content with the address when open', () => {
    render(<BuyManaModal open network="ethereum" address="0xabc" onClose={jest.fn()} />)

    expect(screen.getByTestId('buy-content')).toHaveTextContent('0xabc')
  })
})
