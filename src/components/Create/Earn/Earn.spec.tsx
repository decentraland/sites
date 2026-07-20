import { fireEvent, render } from '@testing-library/react'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { CreatorsEarn } from './Earn'

jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  const Typography = ({ children, ...rest }: { children?: React.ReactNode }) => <p {...rest}>{children}</p>
  const Button = ({ children, ...rest }: { children?: React.ReactNode }) => <a {...rest}>{children}</a>
  const dclColors = { neutral: { white: '#FFFFFF', gray0: '#43404A', gray5: '#ECEBED' } }
  return { ...actual, Typography, Button, dclColors }
})

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../../../hooks/adapters/useTrackLinkContext', () => ({
  useTrackClick: jest.fn()
}))

jest.mock('../AnimatedSection', () => ({
  AnimatedSection: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
}))

jest.mock('../../Video', () => ({
  Video: () => <div data-testid="video" />
}))

const mockTrackClick = jest.mocked(useTrackClick)
const trackClick = jest.fn()

describe('CreatorsEarn', () => {
  beforeEach(() => {
    mockTrackClick.mockReturnValue(trackClick)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the browse-studios and join-registry CTAs are rendered', () => {
    it('should tag both with the Creators Earn place', () => {
      const { container } = render(<CreatorsEarn />)

      const browse = container.querySelector('[data-title="browse-studios"]') as HTMLElement
      const registry = container.querySelector('[data-title="join-registry"]') as HTMLElement

      expect(browse).toHaveAttribute('data-place', 'Creators Earn')
      expect(registry).toHaveAttribute('data-place', 'Creators Earn')
    })

    it('should fire the click adapter when either CTA is clicked', () => {
      const { container } = render(<CreatorsEarn />)

      fireEvent.click(container.querySelector('[data-title="browse-studios"]') as HTMLElement)
      fireEvent.click(container.querySelector('[data-title="join-registry"]') as HTMLElement)

      expect(trackClick).toHaveBeenCalledTimes(2)
    })
  })
})
