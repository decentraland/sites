import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { DiscoverLayout } from './DiscoverLayout'

jest.mock('decentraland-ui2', () => {
  const styled = (Component: React.ElementType) => () => (props: Record<string, unknown>) => <Component {...props} />
  styled.useTheme = () => ({})
  return {
    styled,
    Box: ({ children, ...rest }: { children?: React.ReactNode }) => <div {...rest}>{children}</div>,
    dclColors: { neutral: {}, brand: {}, blackTransparent: {}, whiteTransparent: {} }
  }
})

jest.mock('./DiscoverLayout.styled', () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="discover-page">{children}</div>
}))

describe('DiscoverLayout', () => {
  it('should mount inside a PageContainer for top clearance', () => {
    render(
      <MemoryRouter initialEntries={['/discover']}>
        <DiscoverLayout />
      </MemoryRouter>
    )
    expect(screen.getByTestId('discover-page')).toBeInTheDocument()
  })
})
