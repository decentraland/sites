import { fireEvent, render, screen } from '@testing-library/react'
import { DurationField } from './DurationField'

jest.mock('./EventForm.styled', () => ({
  EventFormControl: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  EventInputLabel: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
  EventMenuItem: ({ children, value }: { children: React.ReactNode; value: string }) => <option value={value}>{children}</option>,
  EventSelect: ({
    value,
    onChange,
    children,
    renderValue
  }: {
    value: string
    onChange: (e: { target: { value: string } }) => void
    children: React.ReactNode
    renderValue: (selected: string) => React.ReactNode
  }) => (
    <div>
      <div data-testid="duration-current">{renderValue(value)}</div>
      <select data-testid="duration-select" value={value} onChange={e => onChange({ target: { value: e.target.value } })}>
        {children}
      </select>
    </div>
  ),
  labelColor: '#a09ba8',
  inputText: '#fcfcfc'
}))

jest.mock('./DurationField.styled', () => ({
  DurationClockIcon: () => <span data-testid="clock-icon" />,
  DurationIconBox: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  DURATION_MENU_MAX_HEIGHT: 288,
  DurationPlaceholder: ({ children }: { children: React.ReactNode }) => <span data-testid="duration-placeholder">{children}</span>
}))

describe('DurationField', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendered without a value', () => {
    it('should show the hh:mm placeholder', () => {
      render(<DurationField value="" startTime="" onChange={jest.fn()} label="Duration" />)

      expect(screen.getByTestId('duration-placeholder')).toHaveTextContent('hh:mm')
    })
  })

  describe('when startTime is empty', () => {
    it('should render 96 duration options (15-min steps up to 24h) with duration-only labels', () => {
      render(<DurationField value="" startTime="" onChange={jest.fn()} label="Duration" />)

      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(96)
      expect(options[0]).toHaveTextContent('15 mins')
      expect(options[3]).toHaveTextContent('1 hr')
      expect(options[4]).toHaveTextContent('1 hr 15 mins')
      expect(options[7]).toHaveTextContent('2 hrs')
      expect(options.at(-1)).toHaveTextContent('24 hrs')
    })
  })

  describe('when startTime is provided', () => {
    it('should prefix each option label with the computed end time', () => {
      render(<DurationField value="" startTime="14:00" onChange={jest.fn()} label="Duration" />)

      const options = screen.getAllByRole('option')
      expect(options[0]).toHaveTextContent('14:15 (15 mins)')
      expect(options[1]).toHaveTextContent('14:30 (30 mins)')
      expect(options[3]).toHaveTextContent('15:00 (1 hr)')
      expect(options[7]).toHaveTextContent('16:00 (2 hrs)')
    })

    it('should wrap end time past 24h back to 00:mm', () => {
      render(<DurationField value="" startTime="23:30" onChange={jest.fn()} label="Duration" />)

      const options = screen.getAllByRole('option')
      expect(options[0]).toHaveTextContent('23:45 (15 mins)')
      expect(options[1]).toHaveTextContent('00:00 (30 mins)')
      expect(options[2]).toHaveTextContent('00:15 (45 mins)')
    })
  })

  describe('when value matches a listed option', () => {
    it('should show that option label in the current-value slot', () => {
      render(<DurationField value="01:30" startTime="14:00" onChange={jest.fn()} label="Duration" />)

      expect(screen.getByTestId('duration-current')).toHaveTextContent('15:30 (1 hr 30 mins)')
    })
  })

  describe('when value is outside the 15-min grid', () => {
    it('should still render the raw HH:MM so edit mode preserves the saved duration', () => {
      render(<DurationField value="00:07" startTime="" onChange={jest.fn()} label="Duration" />)

      expect(screen.getByTestId('duration-current')).toHaveTextContent('00:07')
    })
  })

  describe('when value is not a valid duration string', () => {
    it('should show the placeholder instead of the garbage input', () => {
      render(<DurationField value="abc" startTime="" onChange={jest.fn()} label="Duration" />)

      expect(screen.getByTestId('duration-placeholder')).toHaveTextContent('hh:mm')
    })
  })

  describe('when a user picks an option', () => {
    it('should call onChange with the selected HH:MM duration value', () => {
      const onChange = jest.fn()
      render(<DurationField value="" startTime="" onChange={onChange} label="Duration" />)

      fireEvent.change(screen.getByTestId('duration-select'), { target: { value: '02:15' } })

      expect(onChange).toHaveBeenCalledWith('02:15')
    })
  })
})
