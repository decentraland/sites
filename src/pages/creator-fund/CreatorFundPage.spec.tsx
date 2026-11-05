import { fireEvent, render, screen } from '@testing-library/react'
import { useMediaQuery } from 'decentraland-ui2'
import { heroData } from '../../components/Create/data'
import { useTrackClick } from '../../hooks/adapters/useTrackLinkContext'
import { CreatorFundPage } from './CreatorFundPage'

jest.mock('decentraland-ui2', () => {
  const { styled, Box, dclColors } = jest.requireActual('../../__test-utils__/styledMock')
  const Typography = ({ children, ...rest }: { children?: React.ReactNode }) => <p {...rest}>{children}</p>
  return {
    styled,
    Box,
    Typography,
    dclColors,
    useMediaQuery: jest.fn()
  }
})

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../../hooks/adapters/useTrackLinkContext', () => ({
  useTrackClick: jest.fn()
}))

jest.mock('../../components/Video', () => ({
  Video: ({ source, poster }: { source: string; poster: string }) => <video data-testid="video" src={source} poster={poster} />
}))

// CTAButton's own rendering (MUI Button) is covered by CTAButton.spec; this spec
// only asserts the link and tracking attributes the page wires into it.
jest.mock('../../components/Buttons', () => ({
  CTAButton: ({
    href,
    onClick,
    label,
    place,
    event
  }: {
    href: string
    onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void
    label: string
    place: string
    event: string
  }) => (
    <a href={href} onClick={onClick} data-place={place} data-event={event}>
      {label}
    </a>
  )
}))

describe('CreatorFundPage', () => {
  let trackClick: jest.Mock

  beforeEach(() => {
    trackClick = jest.fn()
    ;(useTrackClick as jest.Mock).mockReturnValue(trackClick)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendered on desktop', () => {
    beforeEach(() => {
      ;(useMediaQuery as jest.Mock).mockReturnValue(false)
      render(<CreatorFundPage />)
    })

    it('should show the coming-soon badge, title, description and pool', () => {
      expect(screen.getByText('page.creator_fund.badge')).toBeInTheDocument()
      expect(screen.getByText('page.creator_fund.title_highlight')).toBeInTheDocument()
      expect(screen.getByText('page.creator_fund.description', { exact: false })).toBeInTheDocument()
      expect(screen.getByText('page.creator_fund.pool')).toBeInTheDocument()
    })

    it('should play the landscape hero video', () => {
      expect(screen.getByTestId('video')).toHaveAttribute('src', heroData.videoLandscape.url)
      expect(screen.getByTestId('video')).toHaveAttribute('poster', heroData.imageLandscape.url)
    })

    it('should link the CTA to the creators page with the Creator Fund place', () => {
      const cta = screen.getByRole('link', { name: 'page.creator_fund.cta' })

      expect(cta).toHaveAttribute('href', '/create')
      expect(cta).toHaveAttribute('data-place', 'Creator Fund Hero')
      expect(cta).toHaveAttribute('data-event', 'Click')
    })

    describe('and the CTA is clicked', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByRole('link', { name: 'page.creator_fund.cta' }))
      })

      it('should track the click', () => {
        expect(trackClick).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('when rendered on mobile', () => {
    beforeEach(() => {
      ;(useMediaQuery as jest.Mock).mockReturnValue(true)
      render(<CreatorFundPage />)
    })

    it('should play the portrait hero video', () => {
      expect(screen.getByTestId('video')).toHaveAttribute('src', heroData.videoPortrait.url)
      expect(screen.getByTestId('video')).toHaveAttribute('poster', heroData.imagePortrait.url)
    })
  })
})
