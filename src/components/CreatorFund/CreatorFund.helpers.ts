import { type DownloadTarget, SectionViewedTrack, SegmentEvent } from '../../modules/segment'

const DAY_MS = 86_400_000

// The program is priced in USD everywhere, so amounts keep the en-US grouping in every locale.
const formatAmount = (amount: number): string => amount.toLocaleString('en-US')

const formatUsd = (amount: number): string => `$${formatAmount(amount)}`

const daysBetween = (from: string, to: string): number => (Date.parse(to) - Date.parse(from)) / DAY_MS

// Program dates are calendar days stored as UTC ISO dates. Formatting them in UTC keeps a
// visitor west of Greenwich from seeing every date shifted one day back.
const shortDateFormat = (locale: string, withYear: boolean): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC', ...(withYear ? { year: 'numeric' } : {}) })

const formatShortDate = (locale: string, isoDate: string, withYear = false): string =>
  shortDateFormat(locale, withYear).format(new Date(isoDate))

// `formatRange` ships in every browser the site supports but is missing from the ES2020 lib typings.
type RangeFormat = Intl.DateTimeFormat & { formatRange: (start: Date, end: Date) => string }

const formatDateRange = (locale: string, start: string, end: string): string =>
  (shortDateFormat(locale, false) as RangeFormat).formatRange(new Date(start), new Date(end))

/**
 * `data-*` attributes for a tracked control on this page. The click adapters turn them into the
 * `Click` payload: `place: 'Creator Fund'`, `section` (where on the page), `button` (stable English
 * name) and, for downloads, `download_target`.
 */
const clickTrackingAttributes = (section: string, button: string, downloadTarget?: DownloadTarget): Record<string, string> => ({
  ['data-place']: SectionViewedTrack.CREATOR_FUND,
  ['data-event']: SegmentEvent.CLICK,
  ['data-section']: section,
  ['data-button']: button,
  ...(downloadTarget ? { ['data-download-target']: downloadTarget } : {})
})

export { clickTrackingAttributes, daysBetween, formatAmount, formatDateRange, formatShortDate, formatUsd }
