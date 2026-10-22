import { renderHook } from '@testing-library/react'
import { createMockEvent } from '../__test-utils__/factories'
import { toUpcomingOccurrence } from '../features/events/events.helpers'
import type { EventEntry } from '../features/events/events.types'
import { useSeriesEventOpener } from './useSeriesEventOpener'

describe('useSeriesEventOpener', () => {
  let open: jest.Mock<void, [EventEntry]>
  let series: EventEntry

  beforeEach(() => {
    open = jest.fn()
    series = createMockEvent({
      id: 'ev-series',
      recurrent: true,
      recurrent_count: 5,
      start_at: '2026-01-07T19:00:00.000Z',
      finish_at: '2026-02-04T20:00:00.000Z',
      next_start_at: '2026-01-21T19:00:00.000Z',
      next_finish_at: '2026-01-21T20:00:00.000Z'
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the opened card holds a rewritten occurrence of a known series', () => {
    it('should open the series as the API returned it', () => {
      const { result } = renderHook(() => useSeriesEventOpener([series], open))

      result.current(toUpcomingOccurrence(series))

      expect(open).toHaveBeenCalledWith(series)
    })
  })

  describe('when the opened event is not in the series list', () => {
    it('should open the event it was given', () => {
      const other = createMockEvent({ id: 'ev-other' })
      const { result } = renderHook(() => useSeriesEventOpener([series], open))

      result.current(other)

      expect(open).toHaveBeenCalledWith(other)
    })
  })
})
