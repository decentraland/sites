import { render, screen } from '@testing-library/react'
import { Logo } from './Logo'

jest.mock('decentraland-ui2', () => ({
  styled: (tag: string) => () => (props: { children?: React.ReactNode } & Record<string, unknown>) => {
    const Component = (tag || 'div') as keyof JSX.IntrinsicElements
    return <Component {...(props as object)}>{props.children}</Component>
  }
}))

jest.mock('../../../hooks/adapters/useTrackLinkContext', () => ({
  useTrackClick: () => jest.fn()
}))

jest.mock('../../../config/env', () => ({
  getEnv: () => 'https://decentraland.org'
}))

describe('Reels Logo', () => {
  it('should render an anchor pointing to the Decentraland homepage', () => {
    render(<Logo />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://decentraland.org')
  })

  it('should render the Decentraland logo image', () => {
    render(<Logo />)
    expect(screen.getByAltText('Decentraland')).toBeInTheDocument()
  })
})
