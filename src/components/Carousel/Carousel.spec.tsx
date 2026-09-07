import { fireEvent, render } from '@testing-library/react'
import { Carousel } from './Carousel'

jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../__test-utils__/styledMock')
  return {
    ...actual,
    useDesktopMediaQuery: () => true,
    useMediaQuery: () => false
  }
})

class ResizeObserverMock {
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
}

const items = ['first', 'second', 'third']
const renderItem = (item: string) => <span>{item}</span>
const keyExtractor = (item: string) => item

const renderCarousel = () =>
  render(<Carousel items={items} renderItem={renderItem} keyExtractor={keyExtractor} autoplayDelay={0} slideWidth={500} />)

const getTrack = (region: HTMLElement) => region.firstElementChild as HTMLElement

describe('Carousel', () => {
  beforeEach(() => {
    window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when a horizontal wheel gesture crosses the swipe threshold', () => {
    it('should advance to the next slide on a rightward swipe and consume the gesture', () => {
      const { getByRole } = renderCarousel()
      const region = getByRole('region')
      const track = getTrack(region)
      const before = track.style.transform

      const notPrevented = fireEvent.wheel(region, { deltaX: 60, deltaY: 0 })

      expect(track.style.transform).not.toBe(before)
      expect(notPrevented).toBe(false)
    })

    it('should go back to the previous slide on a leftward swipe', () => {
      const { getByRole } = renderCarousel()
      const region = getByRole('region')
      const track = getTrack(region)
      const before = track.style.transform

      fireEvent.wheel(region, { deltaX: -60, deltaY: 0 })

      expect(track.style.transform).not.toBe(before)
    })

    it('should accumulate small deltas from the same gesture before stepping', () => {
      const { getByRole } = renderCarousel()
      const region = getByRole('region')
      const track = getTrack(region)
      const before = track.style.transform

      fireEvent.wheel(region, { deltaX: 30, deltaY: 0 })
      expect(track.style.transform).toBe(before)

      fireEvent.wheel(region, { deltaX: 30, deltaY: 0 })
      expect(track.style.transform).not.toBe(before)
    })

    it('should step only once while the slide transition is still running', () => {
      const { getByRole } = renderCarousel()
      const region = getByRole('region')
      const track = getTrack(region)

      fireEvent.wheel(region, { deltaX: 60, deltaY: 0 })
      const afterFirst = track.style.transform

      fireEvent.wheel(region, { deltaX: 200, deltaY: 0 })
      expect(track.style.transform).toBe(afterFirst)
    })
  })

  describe('when the wheel gesture is mostly vertical', () => {
    it('should leave the carousel alone so the page keeps the scroll', () => {
      const { getByRole } = renderCarousel()
      const region = getByRole('region')
      const track = getTrack(region)
      const before = track.style.transform

      const notPrevented = fireEvent.wheel(region, { deltaX: 10, deltaY: 120 })

      expect(track.style.transform).toBe(before)
      expect(notPrevented).toBe(true)
    })
  })
})
