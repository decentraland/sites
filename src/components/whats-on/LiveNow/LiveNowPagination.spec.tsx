import { fireEvent, render, screen } from '@testing-library/react'
import { LiveNowPagination } from './LiveNowPagination'
import { DOT_SLOT } from './LiveNowPagination.styled'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))

// The window shows the highlighted range plus one context dot on each side.
const CONTEXT_DOTS = 1
const expectedOffset = (rangeStart: number, rangeSize: number, count: number) => {
  const windowSize = Math.min(count, rangeSize + CONTEXT_DOTS * 2)
  const maxStart = Math.max(0, count - windowSize)
  const windowStart = Math.min(Math.max(0, rangeStart - CONTEXT_DOTS), maxStart)
  return String(windowStart * DOT_SLOT)
}

const highlightedIndexes = () =>
  screen
    .getAllByRole('button')
    .map((dot, index) => ({ index, on: dot.getAttribute('aria-current') === 'true' }))
    .filter(dot => dot.on)
    .map(dot => dot.index)

describe('LiveNowPagination', () => {
  let onSelect: jest.Mock

  beforeEach(() => {
    onSelect = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when every card is visible at once', () => {
    it('should render nothing when the range covers all cards', () => {
      const { container } = render(<LiveNowPagination count={3} rangeStart={0} rangeSize={3} onSelect={onSelect} label="dots" />)

      expect(container.firstChild).toBeNull()
    })

    it('should render nothing when more cards fit than exist', () => {
      const { container } = render(<LiveNowPagination count={2} rangeStart={0} rangeSize={4} onSelect={onSelect} label="dots" />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('when there are more cards than fit', () => {
    it('should render one dot per card', () => {
      render(<LiveNowPagination count={8} rangeStart={0} rangeSize={4} onSelect={onSelect} label="dots" />)

      expect(screen.getAllByRole('button')).toHaveLength(8)
    })

    it('should highlight the dots of the visible cards as a contiguous group', () => {
      render(<LiveNowPagination count={8} rangeStart={2} rangeSize={4} onSelect={onSelect} label="dots" />)

      expect(highlightedIndexes()).toEqual([2, 3, 4, 5])
    })

    it('should slide the window so the highlighted range stays in view', () => {
      render(<LiveNowPagination count={8} rangeStart={2} rangeSize={4} onSelect={onSelect} label="dots" />)

      // windowStart = clamp(2 - 1, 0, 8 - 6) = 1 → offset = 1 * DOT_SLOT.
      expect(screen.getAllByRole('button')[0].parentElement).toHaveAttribute('offset', expectedOffset(2, 4, 8))
    })

    it('should keep the window at the start while the visible range is the first', () => {
      render(<LiveNowPagination count={8} rangeStart={0} rangeSize={4} onSelect={onSelect} label="dots" />)

      expect(highlightedIndexes()).toEqual([0, 1, 2, 3])
      expect(screen.getAllByRole('button')[0].parentElement).toHaveAttribute('offset', expectedOffset(0, 4, 8))
    })

    it('should keep the window at the end while the visible range is the last', () => {
      render(<LiveNowPagination count={8} rangeStart={4} rangeSize={4} onSelect={onSelect} label="dots" />)

      expect(highlightedIndexes()).toEqual([4, 5, 6, 7])
      expect(screen.getAllByRole('button')[0].parentElement).toHaveAttribute('offset', expectedOffset(4, 4, 8))
    })

    it('should select a card when its dot is clicked', () => {
      render(<LiveNowPagination count={8} rangeStart={0} rangeSize={4} onSelect={onSelect} label="dots" />)

      fireEvent.click(screen.getAllByRole('button')[5])

      expect(onSelect).toHaveBeenCalledWith(5)
    })

    it('should move to the next card on ArrowRight', () => {
      render(<LiveNowPagination count={8} rangeStart={0} rangeSize={4} onSelect={onSelect} label="dots" />)

      fireEvent.keyDown(screen.getAllByRole('button')[0], { key: 'ArrowRight' })

      expect(onSelect).toHaveBeenCalledWith(1)
    })

    it('should wrap to the last card when ArrowLeft is pressed on the first dot', () => {
      render(<LiveNowPagination count={8} rangeStart={0} rangeSize={4} onSelect={onSelect} label="dots" />)

      fireEvent.keyDown(screen.getAllByRole('button')[0], { key: 'ArrowLeft' })

      expect(onSelect).toHaveBeenCalledWith(7)
    })

    it('should ignore keys other than the horizontal arrows', () => {
      render(<LiveNowPagination count={8} rangeStart={0} rangeSize={4} onSelect={onSelect} label="dots" />)

      fireEvent.keyDown(screen.getAllByRole('button')[0], { key: 'Enter' })

      expect(onSelect).not.toHaveBeenCalled()
    })
  })
})
