import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { SecuritySection } from './SecuritySection'

type ChildrenProps = { children?: ReactNode; 'data-role'?: string }
type LinkProps = ChildrenProps & { href?: string; target?: string; rel?: string }

jest.mock('@mui/icons-material/VpnKeyOutlined', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/WarningAmberRounded', () => ({ __esModule: true, default: () => <span /> }))

jest.mock('./SecuritySection.styled', () => ({
  Container: ({ children, 'data-role': dataRole }: ChildrenProps) => <div data-role={dataRole}>{children}</div>,
  TitleRow: ({ children }: ChildrenProps) => <div>{children}</div>,
  SectionTitle: ({ children }: ChildrenProps) => <h2>{children}</h2>,
  Intro: ({ children }: ChildrenProps) => <p>{children}</p>,
  ResponsibilityTitle: ({ children }: ChildrenProps) => <div>{children}</div>,
  ResponsibilityDescription: ({ children }: ChildrenProps) => <div>{children}</div>,
  WarningBox: ({ children }: ChildrenProps) => <div>{children}</div>,
  WarningTextWrapper: ({ children }: ChildrenProps) => <div>{children}</div>,
  WarningTitle: ({ children }: ChildrenProps) => <div>{children}</div>,
  WarningDescription: ({ children }: ChildrenProps) => <div>{children}</div>,
  RevealDescription: ({ children }: ChildrenProps) => <div>{children}</div>,
  RevealActions: ({ children }: ChildrenProps) => <div>{children}</div>
}))

jest.mock('decentraland-ui2', () => ({
  Button: ({ children, href, target, rel, 'data-role': dataRole }: LinkProps) => (
    <a href={href} target={target} rel={rel} data-role={dataRole}>
      {children}
    </a>
  )
}))

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

describe('SecuritySection', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render the private key title, intro, responsibility and warning copy', () => {
    render(<SecuritySection />)

    expect(screen.getByText('account.security.title')).toBeInTheDocument()
    expect(screen.getByText('account.security.intro')).toBeInTheDocument()
    expect(screen.getByText('account.security.responsibility_title')).toBeInTheDocument()
    expect(screen.getByText('account.security.responsibility_description')).toBeInTheDocument()
    expect(screen.getByText('account.security.warning_title')).toBeInTheDocument()
    expect(screen.getByText('account.security.warning_description')).toBeInTheDocument()
    expect(screen.getByText('account.security.reveal_description')).toBeInTheDocument()
  })

  it('should link the reveal button to the Magic reveal page in a new tab', () => {
    render(<SecuritySection />)

    const link = screen.getByRole('link', { name: 'account.security.reveal_button' })
    expect(link).toHaveAttribute('href', 'https://reveal.magic.link/decentraland')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
