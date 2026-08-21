import { fireEvent, render } from '@testing-library/react'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { CreatorsLearn } from './Learn'

jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  const Typography = ({ children, ...rest }: { children?: React.ReactNode }) => <p {...rest}>{children}</p>
  const Button = ({ children, ...rest }: { children?: React.ReactNode }) => <a {...rest}>{children}</a>
  return { ...actual, Typography, Button }
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

jest.mock('./PlayIcon', () => ({
  PlayIcon: () => <svg data-testid="play-icon" />
}))

const mockTrackClick = jest.mocked(useTrackClick)
const trackClick = jest.fn()

describe('CreatorsLearn', () => {
  beforeEach(() => {
    mockTrackClick.mockReturnValue(trackClick)
    window.open = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when a video card is clicked', () => {
    it('should track the click and open the video url', () => {
      const { container } = render(<CreatorsLearn />)

      const cards = container.querySelectorAll('[data-title]')
      const videoCards = Array.from(cards).filter(
        el => el.getAttribute('data-title') !== 'watch-more' && el.getAttribute('data-title') !== 'submit-tutorial'
      )
      expect(videoCards.length).toBeGreaterThan(0)

      fireEvent.click(videoCards[0])

      expect(trackClick).toHaveBeenCalledTimes(1)
      expect(window.open).toHaveBeenCalledWith(expect.any(String), '_blank')
    })
  })

  describe('when the watch-more and submit-tutorial CTAs are rendered', () => {
    it('should tag both with the Creators Learn place and fire the click adapter', () => {
      const { container } = render(<CreatorsLearn />)

      const watchMore = container.querySelector('[data-title="watch-more"]') as HTMLElement
      const submitTutorial = container.querySelector('[data-title="submit-tutorial"]') as HTMLElement

      expect(watchMore).toHaveAttribute('data-place', 'Creators Learn')
      expect(submitTutorial).toHaveAttribute('data-place', 'Creators Learn')

      fireEvent.click(watchMore)
      fireEvent.click(submitTutorial)

      expect(trackClick).toHaveBeenCalledTimes(2)
    })
  })
})
