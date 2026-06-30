import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { UserCreditsStatus } from '../../../../features/account-credits/account-credits.types'
import { CreditsStatusCard } from './CreditsStatusCard'

type ChildrenProps = { children?: ReactNode }
type ButtonProps = ChildrenProps & { onClick?: () => void; 'data-role'?: string }
type LinkProps = ChildrenProps & { href?: string; 'data-role'?: string }

jest.mock('decentraland-ui2', () => ({
  Button: ({ children, onClick, 'data-role': dataRole }: ButtonProps) => (
    <button type="button" data-role={dataRole} onClick={onClick}>
      {children}
    </button>
  ),
  Skeleton: () => <span data-testid="skeleton" />
}))

jest.mock('./CreditsStatusCard.styled', () => ({
  Card: ({ children }: ChildrenProps) => <div>{children}</div>,
  Title: ({ children }: ChildrenProps) => <div>{children}</div>,
  StatusLine: ({ children }: ChildrenProps) => <div>{children}</div>,
  StatusValue: ({ children }: ChildrenProps) => <span>{children}</span>,
  Description: ({ children }: ChildrenProps) => <div>{children}</div>,
  LearnMoreLink: ({ children, href, 'data-role': dataRole }: LinkProps) => (
    <a href={href} data-role={dataRole}>
      {children}
    </a>
  ),
  ActionRow: ({ children }: ChildrenProps) => <div>{children}</div>,
  ErrorText: ({ children, 'data-role': dataRole }: ChildrenProps & { 'data-role'?: string }) => <p data-role={dataRole}>{children}</p>
}))

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

describe('CreditsStatusCard', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when the status is still loading', () => {
    it('should render a skeleton instead of the status and no action button', () => {
      render(<CreditsStatusCard status={undefined} isLoading onJoin={jest.fn()} onLeave={jest.fn()} />)

      expect(screen.getByTestId('skeleton')).toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('when the user is enrolled', () => {
    it('should render the enrolled status and a Leave Program button', () => {
      const onLeave = jest.fn()
      render(<CreditsStatusCard status={UserCreditsStatus.ENROLLED} isLoading={false} onJoin={jest.fn()} onLeave={onLeave} />)

      expect(screen.getByText('account.credits.status.enrolled')).toBeInTheDocument()
      fireEvent.click(screen.getByText('account.credits.leave_button'))
      expect(onLeave).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the user is not registered', () => {
    it('should render a Join Program button that invokes onJoin', () => {
      const onJoin = jest.fn()
      render(<CreditsStatusCard status={UserCreditsStatus.NOT_REGISTERED} isLoading={false} onJoin={onJoin} onLeave={jest.fn()} />)

      expect(screen.getByText('account.credits.status.not_registered')).toBeInTheDocument()
      fireEvent.click(screen.getByText('account.credits.join_button'))
      expect(onJoin).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the user has opted out', () => {
    it('should render the opted-out status and a Join Program button', () => {
      const onJoin = jest.fn()
      render(<CreditsStatusCard status={UserCreditsStatus.OPTED_OUT} isLoading={false} onJoin={onJoin} onLeave={jest.fn()} />)

      expect(screen.getByText('account.credits.status.opted_out')).toBeInTheDocument()
      fireEvent.click(screen.getByText('account.credits.join_button'))
      expect(onJoin).toHaveBeenCalledTimes(1)
    })
  })

  it('should render the Learn more link', () => {
    render(<CreditsStatusCard status={UserCreditsStatus.NOT_REGISTERED} isLoading={false} onJoin={jest.fn()} onLeave={jest.fn()} />)

    expect(screen.getByText('account.credits.learn_more')).toBeInTheDocument()
  })
})
