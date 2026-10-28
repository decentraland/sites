import { fireEvent, render } from '@testing-library/react'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { CreatorsConnect } from './Connect'

jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  const Typography = ({ children, ...rest }: { children?: React.ReactNode }) => <p {...rest}>{children}</p>
  return { ...actual, Typography }
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

jest.mock('../../Carousel', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Carousel: ({ items, renderItem, keyExtractor }: any) => (
    <div>
      {items.map((item: unknown) => (
        <div key={keyExtractor(item)}>{renderItem(item)}</div>
      ))}
    </div>
  )
}))

const mockTrackClick = jest.mocked(useTrackClick)
const trackClick = jest.fn()

describe('CreatorsConnect', () => {
  beforeEach(() => {
    mockTrackClick.mockReturnValue(trackClick)
    window.open = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the Discord CTA is clicked', () => {
    it('should track the click and open the Discord target', () => {
      const { container } = render(<CreatorsConnect />)

      const discord = container.querySelector('[data-title="join-discord"]') as HTMLElement
      expect(discord).toHaveAttribute('data-place', 'Creators Connect')

      fireEvent.click(discord)

      expect(trackClick).toHaveBeenCalledTimes(1)
      expect(window.open).toHaveBeenCalledWith('general.discord_cta_target', '_blank', 'noopener,noreferrer')
    })
  })

  describe('when a testimonial card with a link is clicked', () => {
    it('should track the click and open the card url', () => {
      const { container } = render(<CreatorsConnect />)

      const cards = Array.from(container.querySelectorAll('[data-place="Creators Connect"]')).filter(
        el => el.getAttribute('data-title') !== 'join-discord'
      )
      expect(cards.length).toBeGreaterThan(0)
      cards.forEach(card => fireEvent.click(card))

      // At least one testimonial in the fixtures has a url, so an outbound open fires.
      expect(window.open).toHaveBeenCalled()
      expect(trackClick).toHaveBeenCalled()
    })
  })
})
