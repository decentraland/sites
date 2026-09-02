// Kill switch for the Segment first-party proxy, shared across our dapps: remote flag
// `dapps-seg-alt` (application `dapps`, feature `seg-alt`). ON means "send analytics straight to
// Segment" — the proxy is bypassed and every event goes to Segment's own CDN and Tracking API.
//
// It is read from localStorage and never from the flag service, and that is the whole point:
// analytics boots in `main.tsx` before any flag fetch could answer, and the homepage has a
// Lighthouse budget that forbids adding bytes or a request to the critical path. So this module
// imports nothing (`featureFlagStore` included), the boot-time read is one synchronous
// `getItem`, and the value written by the previous page load is the one that decides. The
// write side lives in `featureFlagStore.ts`, where the flag file is already being fetched.
//
// Consequence to keep in mind when flipping the flag: the switch takes effect on the visit AFTER
// the one that learned the value, and only for visitors who reached a route that reads flags.
const SEGMENT_KILL_SWITCH_KEY = 'dcl-analytics-seg-alt'

const ON = '1'
const OFF = '0'

/**
 * Whether analytics must bypass the first-party proxy on this page load.
 *
 * Absent, unreadable or unrecognized value = false = today's behaviour, the configured proxy.
 * The flag service only publishes enabled flags, so "off" and "absent" are indistinguishable
 * there and both have to mean "keep the proxy" here.
 */
function isSegmentProxyDisabled(): boolean {
  try {
    return localStorage.getItem(SEGMENT_KILL_SWITCH_KEY) === ON
  } catch {
    // Private-mode Safari and blocked-storage setups throw on access. Failing closed keeps the
    // proxy, which is what production already does.
    return false
  }
}

/**
 * Records the last known state of the flag for the next page load. Never called with a value the
 * flag service did not actually answer: a failed fetch must leave the previous value in place,
 * otherwise a service outage would silently push every visitor back onto a proxy the switch was
 * flipped to escape.
 */
function persistSegmentProxyDisabled(disabled: boolean): void {
  try {
    localStorage.setItem(SEGMENT_KILL_SWITCH_KEY, disabled ? ON : OFF)
  } catch {
    // Losing the value only costs one page load of the previous behaviour.
  }
}

export { SEGMENT_KILL_SWITCH_KEY, isSegmentProxyDisabled, persistSegmentProxyDisabled }
