import { act, render, screen } from '@testing-library/react'
import { CreatorsSubnav } from './Subnav'

jest.mock('decentraland-ui2', () => {
  const { styled, dclColors } = jest.requireActual('../../../__test-utils__/styledMock')
  return { styled, dclColors }
})

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../../../config/env', () => ({
  getEnv: jest.fn((key: string) => {
    const urls: Record<string, string> = {
      BUILDER_URL: 'https://decentraland.org/builder',
      WEMOTES_BUILDER_URL: 'https://decentraland.org/creator'
    }
    return urls[key]
  })
}))

const scrollTo = (y: number) => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
}

describe('when the creators sub-nav renders', () => {
  beforeEach(() => {
    scrollTo(0)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should link each tab to its app: overview here, collections to the collections app, scenes/land to the builder', () => {
    render(<CreatorsSubnav />)

    // The violet field behind the bars ships with the sub-nav (both flag-gated together).
    expect(screen.getByTestId('creators-field')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'component.creators_landing.subnav.overview' })).toHaveAttribute('href', '/create')
    expect(screen.getByRole('link', { name: 'component.creators_landing.subnav.collections' })).toHaveAttribute(
      'href',
      'https://decentraland.org/creator/collections'
    )
    expect(screen.getByRole('link', { name: 'component.creators_landing.subnav.scenes' })).toHaveAttribute(
      'href',
      'https://decentraland.org/builder/scenes'
    )
    expect(screen.getByRole('link', { name: 'component.creators_landing.subnav.land' })).toHaveAttribute(
      'href',
      'https://decentraland.org/builder/land'
    )
  })

  it('should mark overview as the current page', () => {
    render(<CreatorsSubnav />)

    expect(screen.getByRole('link', { name: 'component.creators_landing.subnav.overview' })).toHaveAttribute('aria-current', 'page')
  })
})

describe('when the page scrolls', () => {
  it('should deepen the band past the threshold and lighten it back at the top', () => {
    render(<CreatorsSubnav />)
    const band = screen.getByTestId('creators-subnav')

    expect(band).not.toHaveClass('scrolled')

    scrollTo(9)
    expect(band).toHaveClass('scrolled')

    scrollTo(0)
    expect(band).not.toHaveClass('scrolled')
  })
})
