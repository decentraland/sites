import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { DeleteAccountUnavailable } from './DeleteAccountUnavailable'

type NoticeProps = { title: string; description: string; dataRole?: string; children?: ReactNode }

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../../AccountUnavailableNotice/AccountUnavailableNotice', () => ({
  AccountUnavailableNotice: ({ title, description, dataRole }: NoticeProps) => (
    <div data-role={dataRole}>
      <span>{title}</span>
      <span>{description}</span>
    </div>
  )
}))

describe('DeleteAccountUnavailable', () => {
  it('should render the unavailable title and description in a delete-scoped notice', () => {
    const { container } = render(<DeleteAccountUnavailable />)

    expect(screen.getByText('account.delete.unavailable_title')).toBeInTheDocument()
    expect(screen.getByText('account.delete.unavailable_description')).toBeInTheDocument()
    expect(container.querySelector('[data-role="delete-account-unavailable"]')).toBeTruthy()
  })
})
