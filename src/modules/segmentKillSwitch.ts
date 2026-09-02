// Kill switch for the Segment first-party proxy, shared across our dapps: remote flag
// `dapps-seg-alt` (application `dapps`, feature `seg-alt`). ON means "send analytics straight to
// Segment" — the proxy is taken out of the path and every event goes to Segment's own CDN and
// Tracking API. OFF, absent or unknown is what production ships today, the configured proxy.
//
// It is read from localStorage and never from the flag service, and that is the whole point:
// analytics boots in `main.tsx` before any flag fetch could answer, and the homepage has a
// Lighthouse budget that forbids adding bytes or a request to the critical path. So this module
// imports nothing (`featureFlagStore` included) and the value written by an earlier page load is
// the one that decides. The write side lives in `featureFlagStore.ts`, where the flag file is
// already being fetched.
//
// Two consequences of that trade, both load-bearing when someone flips the flag mid-incident:
//
// 1. The switch takes effect on the page load AFTER the one that learned the value.
// 2. Only routes that read a feature flag learn it at all. Today that is `/invite/:referrer`,
//    `/places` and the event create/edit forms. A visitor who only ever sees `/`, `/download` or
//    `/blog` keeps the proxy no matter what the flag says. Reaching those routes means fetching
//    the flag file from the homepage, which is exactly what the Lighthouse budget forbids, so
//    widening the reach is a deliberate decision to make with that budget in hand — not
//    something to bolt on here.
const SEGMENT_KILL_SWITCH_KEY = 'dcl-analytics-seg-alt'

const ON = '1'
const OFF = '0'

function readPersistedValue(): boolean {
  try {
    return localStorage.getItem(SEGMENT_KILL_SWITCH_KEY) === ON
  } catch {
    // Private-mode Safari and blocked-storage setups throw on access. Failing closed keeps the
    // proxy, which is what production already does. Never throws, so importing this module from
    // shell-reachable code is safe (CLAUDE.md rule 16).
    return false
  }
}

// One read per page load, taken when this module is first imported — at boot, through
// `segmentConfig`. Every transport then agrees for the whole session: `main.tsx` configures the
// SDK once, while the beacon in `segmentBeacon.ts` resolves its track URL per event, so a write
// landing mid-session would otherwise split one visit across two hosts. `persistSegmentProxyDisabled`
// deliberately does not refresh this snapshot; what it writes decides the next page load.
let proxyDisabled = readPersistedValue()

/**
 * Whether analytics must skip the first-party proxy on this page load.
 *
 * Absent, unreadable or unrecognized value = false = today's behaviour, the configured proxy.
 * The flag service only publishes enabled flags, so "off" and "absent" are indistinguishable
 * there and both have to mean "keep the proxy" here.
 */
function isSegmentProxyDisabled(): boolean {
  return proxyDisabled
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

/** @internal — exported for testing; not part of this module's public contract. */
function resetSegmentKillSwitchForTests(): void {
  proxyDisabled = readPersistedValue()
}

export { SEGMENT_KILL_SWITCH_KEY, isSegmentProxyDisabled, persistSegmentProxyDisabled, resetSegmentKillSwitchForTests }
