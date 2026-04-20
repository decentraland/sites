import { fireEvent, render, screen } from '@testing-library/react'
import { DateNavigation } from './DateNavigation'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'all_experiences.today': 'Today',
        'all_experiences.tomorrow': 'Tomorrow',
        'all_experiences.navigate_previous': 'Navigate to previous dates',
        'all_experiences.navigate_next': 'Navigate to next dates'
      }
      return translations[key] ?? key
    }
  })
}))

jest.mock('./DateNavigation.styled', () => ({
  NavigationBar: ({ children, ...props }: Record<string, unknown>) => (
    <nav data-testid="navigation-bar" role={props.role as string} aria-label={props['aria-label'] as string}>
      {children as React.ReactNode}
    </nav>
  ),
  DateLabel: ({ children, ...props }: Record<string, unknown>) => (
    <span data-testid="date-label" data-is-today={props.isToday} aria-label={props['aria-label'] as string}>
      {children as React.ReactNode}
    </span>
  ),
  NavButton: ({ children, onClick, disabled, side, ...props }: Record<string, unknown>) => (
    <button
      data-testid="nav-button"
      data-side={side as string}
      onClick={onClick as React.MouseEventHandler}
      disabled={disabled as boolean}
      aria-label={props['aria-label'] as string}
      aria-disabled={props['aria-disabled'] as boolean}
      tabIndex={props.tabIndex as number}
    >
      {children as React.ReactNode}
    </button>
  )
}))

jest.mock('@mui/icons-material/ChevronLeft', () => ({
  __esModule: true,
  default: () => <span data-testid="chevron-left" />
}))

jest.mock('@mui/icons-material/ChevronRight', () => ({
  __esModule: true,
  default: () => <span data-testid="chevron-right" />
}))

describe('DateNavigation', () => {
  let onNavigateLeft: jest.Mock
  let onNavigateRight: jest.Mock

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2026, 8, 13, 10, 0, 0))
    onNavigateLeft = jest.fn()
    onNavigateRight = jest.fn()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.resetAllMocks()
  })

  describe('when startOffset is 0 (showing today)', () => {
    it('should render "Today" as the first label', () => {
      render(
        <DateNavigation
          startOffset={0}
          columnCount={3}
          today={new Date(2026, 8, 13)}
          onNavigateLeft={onNavigateLeft}
          onNavigateRight={onNavigateRight}
        />
      )

      const labels = screen.getAllByTestId('date-label')
      expect(labels[0]).toHaveTextContent('Today')
    })

    it('should render "Tomorrow" as the second label', () => {
      render(
        <DateNavigation
          startOffset={0}
          columnCount={3}
          today={new Date(2026, 8, 13)}
          onNavigateLeft={onNavigateLeft}
          onNavigateRight={onNavigateRight}
        />
      )

      const labels = screen.getAllByTestId('date-label')
      expect(labels[1]).toHaveTextContent('Tomorrow')
    })

    it('should disable the left chevron', () => {
      render(
        <DateNavigation
          startOffset={0}
          columnCount={3}
          today={new Date(2026, 8, 13)}
          onNavigateLeft={onNavigateLeft}
          onNavigateRight={onNavigateRight}
        />
      )

      const buttons = screen.getAllByTestId('nav-button')
      expect(buttons[0]).toHaveAttribute('aria-disabled', 'true')
      expect(buttons[0]).toHaveAttribute('tabindex', '-1')
    })
  })

  describe('when startOffset is greater than 0', () => {
    it('should enable the left chevron', () => {
      render(
        <DateNavigation
          startOffset={3}
          columnCount={3}
          today={new Date(2026, 8, 13)}
          onNavigateLeft={onNavigateLeft}
          onNavigateRight={onNavigateRight}
        />
      )

      const buttons = screen.getAllByTestId('nav-button')
      expect(buttons[0]).not.toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('when the left chevron is clicked', () => {
    it('should call onNavigateLeft', () => {
      render(
        <DateNavigation
          startOffset={3}
          columnCount={3}
          today={new Date(2026, 8, 13)}
          onNavigateLeft={onNavigateLeft}
          onNavigateRight={onNavigateRight}
        />
      )

      const buttons = screen.getAllByTestId('nav-button')
      fireEvent.click(buttons[0])
      expect(onNavigateLeft).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the right chevron is clicked', () => {
    it('should call onNavigateRight', () => {
      render(
        <DateNavigation
          startOffset={0}
          columnCount={3}
          today={new Date(2026, 8, 13)}
          onNavigateLeft={onNavigateLeft}
          onNavigateRight={onNavigateRight}
        />
      )

      const buttons = screen.getAllByTestId('nav-button')
      fireEvent.click(buttons[1])
      expect(onNavigateRight).toHaveBeenCalledTimes(1)
    })
  })

  describe('when columnCount varies', () => {
    it('should render 5 date labels for 5 columns', () => {
      render(
        <DateNavigation
          startOffset={0}
          columnCount={5}
          today={new Date(2026, 8, 13)}
          onNavigateLeft={onNavigateLeft}
          onNavigateRight={onNavigateRight}
        />
      )

      expect(screen.getAllByTestId('date-label')).toHaveLength(5)
    })

    it('should render 1 date label for 1 column', () => {
      render(
        <DateNavigation
          startOffset={0}
          columnCount={1}
          today={new Date(2026, 8, 13)}
          onNavigateLeft={onNavigateLeft}
          onNavigateRight={onNavigateRight}
        />
      )

      expect(screen.getAllByTestId('date-label')).toHaveLength(1)
    })
  })
})
