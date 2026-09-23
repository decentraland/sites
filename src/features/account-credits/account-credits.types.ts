/**
 * User credits status enum — matches the credits-server response values
 * (mirrors the standalone account dapp's `UserCreditsStatus` in
 * `account/src/lib/api/credits.ts`).
 */
enum UserCreditsStatus {
  ENROLLED = 'enrolled',
  OPTED_OUT = 'opted_out',
  NOT_REGISTERED = 'not_registered'
}

/** Decoded `data` payload from `GET /users/:address/status`. */
interface UserCreditsStatusResponse {
  status: UserCreditsStatus
  optedOutAt: string | null
}

/** Raw credits-server envelope — the meaningful payload sits under `data`. */
interface UserCreditsStatusEnvelope {
  data: UserCreditsStatusResponse
}

export { UserCreditsStatus }
export type { UserCreditsStatusEnvelope, UserCreditsStatusResponse }
