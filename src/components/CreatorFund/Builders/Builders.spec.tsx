import { fireEvent, render, screen } from '@testing-library/react'
import { useMediaQuery } from 'decentraland-ui2'
import { builderQuotes } from '../data'
import { Builders } from './Builders'

jest.mock('decentraland-ui2', () => {
  const { styled, Box, dclColors, keyframes } = jest.requireActual('../../../__test-utils__/styledMock')
  return { styled, Box, dclColors, keyframes, useMediaQuery: jest.fn() }
})

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string, values?: Record<string, unknown>) => (values ? `${id} ${JSON.stringify(values)}` : id)
}))

const mockTrackClick = jest.fn()

jest.mock('../../../hooks/useUnloadSafeTrackClick', () => ({
  useUnloadSafeTrackClick: () => mockTrackClick
}))

const slideButton = (number: number) => screen.getByRole('button', { name: `page.creator_fund.builders.go_to_slide {"number":${number}}` })
const currentSlide = () => screen.getAllByRole('button', { current: true })

describe('Builders', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendered on desktop', () => {
    beforeEach(() => {
      ;(useMediaQuery as jest.Mock).mockReturnValue(false)
      render(<Builders />)
    })

    it('should show every builder quote', () => {
      builderQuotes.forEach(builder => expect(screen.getByText(`“${builder.quote}”`)).toBeInTheDocument())
    })

    it('should name every builder', () => {
      builderQuotes.forEach(builder => expect(screen.getByText(builder.name)).toBeInTheDocument())
    })

    it('should show the first letter of the name for builders without a photo', () => {
      builderQuotes
        .filter(builder => !builder.image)
        .forEach(builder => expect(screen.getAllByText(builder.name[0]).length).toBeGreaterThan(0))
    })

    it('should not render paging controls when every quote fits on one row', () => {
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('when rendered on mobile', () => {
    beforeEach(() => {
      ;(useMediaQuery as jest.Mock).mockReturnValue(true)
      render(<Builders />)
    })

    it('should offer one page per quote', () => {
      expect(screen.getAllByRole('button', { name: /go_to_slide/ })).toHaveLength(builderQuotes.length)
    })

    it('should start on the first page', () => {
      expect(currentSlide()).toEqual([slideButton(1)])
    })

    it('should tag every paging control for click tracking', () => {
      screen.getAllByRole('button').forEach(button => {
        expect(button).toHaveAttribute('data-place', 'Creator Fund')
        expect(button).toHaveAttribute('data-section', 'builders')
        expect(button.getAttribute('data-button')).toBeTruthy()
      })
    })

    describe('and next is clicked', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByRole('button', { name: 'page.creator_fund.builders.next' }))
      })

      it('should move to the second page', () => {
        expect(currentSlide()).toEqual([slideButton(2)])
      })

      it('should track the click', () => {
        expect(mockTrackClick).toHaveBeenCalledTimes(1)
      })
    })

    describe('and previous is clicked on the first page', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByRole('button', { name: 'page.creator_fund.builders.previous' }))
      })

      it('should wrap around to the last page', () => {
        expect(currentSlide()).toEqual([slideButton(builderQuotes.length)])
      })
    })

    describe('and a page dot is clicked', () => {
      beforeEach(() => {
        fireEvent.click(slideButton(builderQuotes.length))
      })

      it('should jump to that page', () => {
        expect(currentSlide()).toEqual([slideButton(builderQuotes.length)])
      })
    })
  })
})
