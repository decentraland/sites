import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { DeleteAccountUnavailable } from './DeleteAccountUnavailable'

jest.mock('@mui/icons-material/InfoOutlined', () => ({ __esModule: true, default: () => <span /> }))

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

type ChildrenRole = { children?: ReactNode; 'data-role'?: string }

jest.mock('./DeleteAccountUnavailable.styled', () => ({
  Container: ({ children, 'data-role': dataRole }: ChildrenRole) => <div data-role={dataRole}>{children}</div>,
  TextWrapper: ({ children }: ChildrenRole) => <div>{children}</div>,
  Title: ({ children }: ChildrenRole) => <h3>{children}</h3>,
  Description: ({ children }: ChildrenRole) => <p>{children}</p>
}))

describe('DeleteAccountUnavailable', () => {
  it('should render the unavailable title and description', () => {
    render(<DeleteAccountUnavailable />)

    expect(screen.getByText('account.delete.unavailable_title')).toBeInTheDocument()
    expect(screen.getByText('account.delete.unavailable_description')).toBeInTheDocument()
  })
})
