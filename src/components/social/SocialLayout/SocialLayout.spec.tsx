import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { SocialLayout } from './SocialLayout'

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
  PageContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="social-page">{children}</div>
}))

describe('SocialLayout', () => {
  it('should mount inside a PageContainer for top clearance', () => {
    render(
      <MemoryRouter initialEntries={['/discover']}>
        <SocialLayout />
      </MemoryRouter>
    )
    expect(screen.getByTestId('social-page')).toBeInTheDocument()
  })
})
