import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { SocialLayout } from './SocialLayout'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('decentraland-ui2', () => {
  const styled = (Component: React.ElementType) => () => (props: Record<string, unknown>) => <Component {...props} />
  styled.useTheme = () => ({})
  return {
    styled,
    Box: ({ children, ...rest }: { children?: React.ReactNode }) => <div {...rest}>{children}</div>,
    dclColors: { neutral: {}, brand: {}, blackTransparent: {}, whiteTransparent: {} }
  }
})

jest.mock('./SocialLayout.styled', () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="social-page">{children}</div>,
  NavBar: ({ children }: { children: React.ReactNode }) => <nav data-testid="social-nav">{children}</nav>,
  NavList: ({ children }: { children: React.ReactNode }) => <div role="tablist">{children}</div>,
  NavButton: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  )
}))

describe('SocialLayout', () => {
  it('should render the two /social/* tabs as navigation buttons', () => {
    render(
      <MemoryRouter initialEntries={['/social']}>
        <SocialLayout />
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: 'social.nav.live' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'social.nav.communities' })).toBeInTheDocument()
  })

  it('should mount inside a PageContainer for top clearance', () => {
    render(
      <MemoryRouter initialEntries={['/social']}>
        <SocialLayout />
      </MemoryRouter>
    )
    expect(screen.getByTestId('social-page')).toBeInTheDocument()
  })
})
