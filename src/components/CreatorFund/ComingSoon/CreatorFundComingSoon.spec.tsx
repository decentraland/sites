import { render, screen } from '@testing-library/react'
import { useMediaQuery } from 'decentraland-ui2'
import { heroData } from '../../Create/data'
import { CreatorFundComingSoon } from './CreatorFundComingSoon'

jest.mock('decentraland-ui2', () => {
  const { styled, Box, dclColors } = jest.requireActual('../../../__test-utils__/styledMock')
  const Typography = ({ children, ...rest }: { children?: React.ReactNode }) => <h1 {...rest}>{children}</h1>
  return {
    styled,
    Box,
    Typography,
    dclColors,
    useMediaQuery: jest.fn()
  }
})

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../../Video', () => ({
  Video: ({ source, poster }: { source: string; poster: string }) => <video data-testid="video" src={source} poster={poster} />
}))

describe('CreatorFundComingSoon', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendered on desktop', () => {
    beforeEach(() => {
      ;(useMediaQuery as jest.Mock).mockReturnValue(false)
      render(<CreatorFundComingSoon />)
    })

    it('should show only the Creator Fund title and the coming-soon line', () => {
      const heading = screen.getByRole('heading')

      expect(heading).toHaveTextContent('page.creator_fund.title')
      expect(heading).toHaveTextContent('page.creator_fund.coming_soon')
    })

    it('should not render any call to action', () => {
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('should play the landscape hero video', () => {
      expect(screen.getByTestId('video')).toHaveAttribute('src', heroData.videoLandscape.url)
      expect(screen.getByTestId('video')).toHaveAttribute('poster', heroData.imageLandscape.url)
    })
  })

  describe('when rendered on mobile', () => {
    beforeEach(() => {
      ;(useMediaQuery as jest.Mock).mockReturnValue(true)
      render(<CreatorFundComingSoon />)
    })

    it('should play the portrait hero video', () => {
      expect(screen.getByTestId('video')).toHaveAttribute('src', heroData.videoPortrait.url)
      expect(screen.getByTestId('video')).toHaveAttribute('poster', heroData.imagePortrait.url)
    })
  })
})
