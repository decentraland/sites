import { fireEvent, render, screen } from '@testing-library/react'
import { useMediaQuery } from 'decentraland-ui2'
import { connectCards } from '../../Create/data'
import { Builders } from './Builders'

jest.mock('decentraland-ui2', () => {
  const { styled, Box, dclColors, keyframes } = jest.requireActual('../../../__test-utils__/styledMock')
  return { styled, Box, dclColors, keyframes, useMediaQuery: jest.fn() }
})

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string, values?: Record<string, unknown>) => (values ? `${id} ${JSON.stringify(values)}` : id)
}))

const slideButton = (number: number) => screen.getByRole('button', { name: `page.creator_fund.builders.go_to_slide {"number":${number}}` })
const currentSlide = () => screen.getAllByRole('button', { current: true })

describe('Builders', () => {
  beforeEach(() => {
    window.matchMedia = jest.fn(() => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    })) as unknown as typeof window.matchMedia
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendered on desktop', () => {
    beforeEach(() => {
      ;(useMediaQuery as jest.Mock).mockReturnValue(false)
      render(<Builders />)
    })

    it('should offer one page per possible first card of three', () => {
      expect(screen.getAllByRole('button', { name: /go_to_slide/ })).toHaveLength(connectCards.length - 2)
    })

    it('should start on the first page', () => {
      expect(currentSlide()).toEqual([slideButton(1)])
    })

    describe('and next is clicked', () => {
      beforeEach(() => {
        fireEvent.click(screen.getAllByRole('button', { name: 'page.creator_fund.builders.next' })[0])
      })

      it('should move to the second page', () => {
        expect(currentSlide()).toEqual([slideButton(2)])
      })
    })

    describe('and previous is clicked on the first page', () => {
      beforeEach(() => {
        fireEvent.click(screen.getAllByRole('button', { name: 'page.creator_fund.builders.previous' })[0])
      })

      it('should wrap around to the last page', () => {
        expect(currentSlide()).toEqual([slideButton(connectCards.length - 2)])
      })
    })

    describe('and a page dot is clicked', () => {
      beforeEach(() => {
        fireEvent.click(slideButton(3))
      })

      it('should jump to that page', () => {
        expect(currentSlide()).toEqual([slideButton(3)])
      })
    })
  })

  describe('when rendered on mobile', () => {
    beforeEach(() => {
      ;(useMediaQuery as jest.Mock).mockReturnValue(true)
      render(<Builders />)
    })

    it('should offer one page per card', () => {
      expect(screen.getAllByRole('button', { name: /go_to_slide/ })).toHaveLength(connectCards.length)
    })
  })
})
