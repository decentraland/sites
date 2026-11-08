import { safeParseStoredId } from './segmentAnonymousId.helpers'

const USER_ID_KEY = 'ajs_user_id'

/**
 * Returns the Segment user id analytics-next persists after `identify()` — on
 * decentraland.org this is the connected wallet address (lowercase `0x…`).
 *
 * The unload-safe beacon transport (`postSegmentEvent`) bypasses analytics-next
 * entirely, so it never picks up the identified `userId` the SDK auto-attaches
 * to its `page`/`track` calls. Without this, every beacon event (`download_*`,
 * `download_funnel_exit`, the cold-load `Click`) shipped with only an
 * `anonymousId`, dropping the authenticated wallet and forcing the warehouse to
 * join the download funnel to the user indirectly. Reading the SDK's own
 * `ajs_user_id` key (the JSON-encoded identity store) keeps the beacon's
 * `userId` aligned with the
 * SDK's exactly — same value, same casing.
 *
 * Returns `undefined` for anonymous visitors (no `ajs_user_id`), so the beacon
 * omits `userId` and ships anonymously — mirroring the SDK's own behavior.
 *
 * Identified userId remains localStorage-first in the SDK; anonymousId is
 * separately reconciled through the shared cookie. Two authed
 * cases therefore fall back to anonymous rather than mismatch the SDK: (1) a
 * cookie-only session where localStorage was blocked when the SDK called
 * `identify()` — analytics-next still writes the cookie, which we don't read;
 * (2) a first-time-this-session login whose beacon fires before the SDK has
 * persisted `ajs_user_id`. Both are narrow; returning authed users carry a
 * persisted `ajs_user_id` from localStorage on the next load. Sending a wallet
 * from another source instead would risk a `userId` the SDK's own events lack,
 * breaking rather than enabling the warehouse join.
 */
function resolveSegmentUserId(): string | undefined {
  try {
    const raw = localStorage.getItem(USER_ID_KEY)
    if (!raw) return undefined
    const parsed = safeParseStoredId(raw)
    return parsed ? parsed : undefined
  } catch {
    return undefined
  }
}

export { resolveSegmentUserId }
