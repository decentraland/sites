import { createThirdwebClient } from 'thirdweb'
import { getEnv } from '../config/env'

// NOTE: Pulling in the `thirdweb` SDK is a deliberate deviation from the sites
// "no Web3 providers" rule (see CLAUDE.md > Auth flow). It is justified because
// account deletion for thirdweb in-app (email / social-OTP) wallets happens
// entirely client-side via the thirdweb SDK — there is no server endpoint to
// delegate the unlink/delete to. The dependency is only ever loaded by the
// Delete Account section, which is reachable behind the localStorage auth gate.

/**
 * Singleton thirdweb client instance shared across the Delete Account flow.
 * `THIRDWEB_CLIENT_ID` lives in `src/config/env/*.json` and is safe to ship to
 * the client (it is a public client id, not a secret).
 */
export const thirdwebClient = createThirdwebClient({ clientId: getEnv('THIRDWEB_CLIENT_ID') ?? '' })
