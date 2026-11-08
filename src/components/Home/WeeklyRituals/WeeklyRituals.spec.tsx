import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { weeklyRitualsContent } from '../../../data/static-content'
import type { HomeDetailSelection } from '../HomeDetailModal/HomeDetailModal.types'
import { WeeklyRituals } from './WeeklyRituals'

jest.mock('decentraland-ui2', () => ({
  ...jest.requireActual('../../../__test-utils__/ui2Mock').createUi2Mock(),
  useMediaQuery: () => mockIsMobile,
  useDesktopMediaQuery: () => true
}))

let mockIsMobile = false

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

const mockTrackClick = jest.fn()
jest.mock('../../../hooks/adapters/useTrackLinkContext', () => ({
  useTrackClick: () => mockTrackClick
}))

jest.mock('../../../utils/assetUrl', () => ({ assetUrl: (path: string) => `https://cdn.example.com${path}` }))

jest.mock('../HomeDetailModal/HomeDetailModalLoader', () => ({
  HomeDetailModalLoader: ({ selection, onClose }: { selection: HomeDetailSelection | null; onClose: () => void }) => (
    <div data-testid="loader" data-selection={JSON.stringify(selection)}>
      <button onClick={onClose}>close detail</button>
    </div>
  )
}))

const currentSelection = () => JSON.parse(screen.getByTestId('loader').getAttribute('data-selection') as string)

const renderSection = () =>
  render(
    <MemoryRouter>
      <WeeklyRituals />
    </MemoryRouter>
  )

const [careerMondays] = weeklyRitualsContent.cards

describe('when rendering the weekly rituals section', () => {
  beforeEach(() => {
    mockIsMobile = false
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the cards are rendered', () => {
    beforeEach(() => {
      renderSection()
    })

    it('should render every ritual as a button, not a link to another tab', () => {
      expect(screen.queryAllByRole('link')).toHaveLength(0)
      expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(weeklyRitualsContent.cards.length)
    })

    it('should have nothing selected', () => {
      expect(currentSelection()).toBeNull()
    })
  })

  describe('and a card is clicked', () => {
    beforeEach(async () => {
      renderSection()
      await userEvent.click(screen.getAllByAltText(careerMondays.titleKey)[0])
    })

    it('should select the ritual event by its id', () => {
      expect(currentSelection()).toEqual({ kind: 'event', id: careerMondays.eventId })
    })

    it('should track the click', () => {
      expect(mockTrackClick).toHaveBeenCalledTimes(1)
    })

    describe('and the detail is closed', () => {
      beforeEach(async () => {
        await userEvent.click(screen.getByText('close detail'))
      })

      it('should clear the selection', () => {
        expect(currentSelection()).toBeNull()
      })
    })
  })

  describe('and a card is activated with the keyboard', () => {
    beforeEach(async () => {
      renderSection()
      const button = screen.getAllByAltText(careerMondays.titleKey)[0].closest('button') as HTMLButtonElement
      button.focus()
      await userEvent.keyboard('{Enter}')
    })

    it('should select the ritual event', () => {
      expect(currentSelection()).toEqual({ kind: 'event', id: careerMondays.eventId })
    })
  })

  describe('and the card is dragged before the click lands', () => {
    beforeEach(() => {
      renderSection()
      const image = screen.getAllByAltText(careerMondays.titleKey)[0]
      const track = image.closest('button')?.parentElement?.parentElement as HTMLElement
      fireEvent.mouseDown(track, { button: 0, clientX: 100 })
      fireEvent.mouseMove(window, { clientX: 220 })
      fireEvent.mouseUp(window)
      fireEvent.click(image)
    })

    it('should not select anything', () => {
      expect(currentSelection()).toBeNull()
    })
  })

  describe('and the viewport is mobile', () => {
    beforeEach(() => {
      mockIsMobile = true
      renderSection()
    })

    it('should render the mobile artwork', () => {
      expect(screen.getAllByAltText(careerMondays.titleKey)[0]).toHaveAttribute('src', careerMondays.mobileImageUrl)
    })
  })
})
