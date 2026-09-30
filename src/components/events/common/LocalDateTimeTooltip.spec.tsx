import { render, screen } from '@testing-library/react'
import { LocalDateTimeTooltip } from './LocalDateTimeTooltip'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) => (values ? `${key}:${JSON.stringify(values)}` : key),
    locale: 'en-US'
  })
}))

jest.mock('decentraland-ui2', () => ({
  Tooltip: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <span data-testid="tooltip-wrapper" data-title={title}>
      {children}
    </span>
  ),
  styled: () => () => (props: Record<string, unknown>) => <span {...props} />
}))

describe('LocalDateTimeTooltip', () => {
  describe('when both startIso and finishIso are provided', () => {
    it('should set the tooltip body to the UTC range', () => {
      render(
        <LocalDateTimeTooltip startIso="2026-04-07T10:00:00Z" finishIso="2026-04-07T12:00:00Z">
          <span data-testid="trigger">10:00 AM</span>
        </LocalDateTimeTooltip>
      )

      expect(screen.getByTestId('tooltip-wrapper').getAttribute('data-title')).toContain('event_time.utc_range_same_day')
    })
  })

  describe('when no finishIso is provided', () => {
    it('should set the tooltip body to the single UTC time', () => {
      render(
        <LocalDateTimeTooltip startIso="2026-04-07T10:00:00Z">
          <span data-testid="trigger">10:00 AM</span>
        </LocalDateTimeTooltip>
      )

      expect(screen.getByTestId('tooltip-wrapper').getAttribute('data-title')).toContain('event_time.utc_same_day')
    })
  })
})
