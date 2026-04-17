import { fireEvent, render, screen } from '@testing-library/react'
import { ToggleSwitch } from './ToggleSwitch'
import type { ToggleSwitchProps } from './ToggleSwitch'

jest.mock('./ToggleSwitch.styled', () => ({
  ToggleContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ToggleLabel: ({ children }: { children: React.ReactNode }) => <span data-testid="toggle-label">{children}</span>,
  ToggleThumb: (_props: Record<string, unknown>) => <span data-testid="toggle-thumb" />,
  ToggleTrack: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode; $checked: boolean }) => {
    const { $checked, ...rest } = props as Record<string, unknown>
    return (
      <button
        data-testid="toggle-track"
        role="switch"
        aria-checked={$checked as boolean}
        aria-label={rest['aria-label'] as string}
        onClick={rest.onClick as React.MouseEventHandler<HTMLButtonElement>}
      >
        {children}
      </button>
    )
  }
}))

describe('ToggleSwitch', () => {
  let props: ToggleSwitchProps

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendered with unchecked state', () => {
    beforeEach(() => {
      props = {
        label: 'Repeat Event',
        checked: false,
        onChange: jest.fn()
      }
    })

    it('should render the label text', () => {
      render(<ToggleSwitch {...props} />)

      expect(screen.getByTestId('toggle-label')).toHaveTextContent('Repeat Event')
    })

    it('should render as unchecked', () => {
      render(<ToggleSwitch {...props} />)

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    })
  })

  describe('when rendered with checked state', () => {
    beforeEach(() => {
      props = {
        label: 'Repeat Event',
        checked: true,
        onChange: jest.fn()
      }
    })

    it('should render as checked', () => {
      render(<ToggleSwitch {...props} />)

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('when clicked', () => {
    let mockOnChange: jest.Mock

    beforeEach(() => {
      mockOnChange = jest.fn()
      props = {
        label: 'Repeat Event',
        checked: false,
        onChange: mockOnChange
      }
    })

    it('should call onChange with toggled value', () => {
      render(<ToggleSwitch {...props} />)

      fireEvent.click(screen.getByRole('switch'))

      expect(mockOnChange).toHaveBeenCalledWith(true)
    })
  })

  describe('when clicked and currently checked', () => {
    let mockOnChange: jest.Mock

    beforeEach(() => {
      mockOnChange = jest.fn()
      props = {
        label: 'Repeat Event',
        checked: true,
        onChange: mockOnChange
      }
    })

    it('should call onChange with false', () => {
      render(<ToggleSwitch {...props} />)

      fireEvent.click(screen.getByRole('switch'))

      expect(mockOnChange).toHaveBeenCalledWith(false)
    })
  })
})
