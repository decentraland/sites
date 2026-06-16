import { createThirdwebClient } from 'thirdweb'
import type { ThirdwebClient } from 'thirdweb'
import { getEnv } from '../config/env'

// NOTE: Pulling in the `thirdweb` SDK is a deliberate deviation from the sites
// "no Web3 providers" rule (see CLAUDE.md > Auth flow). It is justified because
// account deletion for thirdweb in-app (email / social-OTP) wallets happens
// entirely client-side via the thirdweb SDK — there is no server endpoint to
// delegate the unlink/delete to. The dependency is only ever loaded by the
// Delete Account section, which is reachable behind the localStorage auth gate.

let client: ThirdwebClient | undefined

/**
 * Lazily constructs (and memoises) the thirdweb client for the Delete Account flow.
 * Must be a getter, NOT a module-level constant: `createThirdwebClient` throws when
 * `clientId` is empty, and this module is reachable from the lazy `DappsShell` chunk —
 * a top-level throw would crash the whole chunk (CLAUDE.md rule 16). Deferring construction
 * to call time keeps the failure scoped to the delete action.
 *
 * `THIRDWEB_CLIENT_ID` lives in `src/config/env/*.json` and is safe to ship to the client
 * (it is a public client id, not a secret).
 */
const getThirdwebClient = (): ThirdwebClient => {
  if (!client) {
    const clientId = getEnv('THIRDWEB_CLIENT_ID')
    if (!clientId) throw new Error('THIRDWEB_CLIENT_ID environment variable is not set')
    client = createThirdwebClient({ clientId })
  }
  return client
}

export { getThirdwebClient }
