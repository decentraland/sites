import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { AccountUnavailableNotice } from './AccountUnavailableNotice'

type ChildrenRole = { children?: ReactNode; 'data-role'?: string }

jest.mock('@mui/icons-material/InfoOutlined', () => ({ __esModule: true, default: () => <span /> }))

jest.mock('./AccountUnavailableNotice.styled', () => ({
  Container: ({ children, 'data-role': dataRole }: ChildrenRole) => <div data-role={dataRole}>{children}</div>,
  TextWrapper: ({ children }: ChildrenRole) => <div>{children}</div>,
  Title: ({ children }: ChildrenRole) => <h3>{children}</h3>,
  Description: ({ children }: ChildrenRole) => <p>{children}</p>
}))

describe('AccountUnavailableNotice', () => {
  it('should render the title and description and forward the data-role', () => {
    const { container } = render(<AccountUnavailableNotice title="Not available" description="Nothing to see" dataRole="my-notice" />)

    expect(screen.getByText('Not available')).toBeInTheDocument()
    expect(screen.getByText('Nothing to see')).toBeInTheDocument()
    expect(container.querySelector('[data-role="my-notice"]')).toBeTruthy()
  })
})
