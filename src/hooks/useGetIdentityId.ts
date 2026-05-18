import { useCallback, useRef } from 'react'
import { Env, getEnv } from '@dcl/ui-env'
import { useAuthIdentity } from './useAuthIdentity'

// `@dcl/crypto/dist/Authenticator` pulls in ~340 KB of crypto deps. Loading it
// statically would put the whole vendor-crypto chunk on the homepage critical
// path, since this hook is consumed by DownloadOptions on `/`. Defer the
// import to the actual click-time callback so vendor-crypto stays lazy.
const loadAuthenticator = () => import('@dcl/crypto/dist/Authenticator').then(m => m.Authenticator)

const AUTH_CHAIN_HEADER_PREFIX = 'x-identity-auth-chain-'
const AUTH_TIMESTAMP_HEADER = 'x-identity-timestamp'
const AUTH_METADATA_HEADER = 'x-identity-metadata'

type IdentityApiResponse = {
  ok?: boolean
  data?: { identityId?: string }
  identityId?: string
}

export function useGetIdentityId(): () => Promise<string | undefined> {
  const { identity } = useAuthIdentity()
  const identityRef = useRef(identity)
  identityRef.current = identity

  return useCallback(async (): Promise<string | undefined> => {
    const currentIdentity = identityRef.current
    if (!currentIdentity?.authChain || !currentIdentity?.ephemeralIdentity) {
      return undefined
    }

    try {
      const authApiUrl = getEnv() === Env.DEVELOPMENT ? 'https://auth-api.decentraland.zone' : 'https://auth-api.decentraland.org'

      const method = 'POST'
      const path = '/identities'
      const metadata = { signer: 'dcl:auth', intent: 'dcl:auth:create-identity' }
      const timestamp = String(Date.now())
      const payload = [method, path, timestamp, JSON.stringify(metadata)].join(':').toLowerCase()

      const authenticator = await loadAuthenticator()
      const chain = authenticator.signPayload(currentIdentity, payload)
      const headers: Record<string, string> = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/json',
        [AUTH_TIMESTAMP_HEADER]: timestamp,
        [AUTH_METADATA_HEADER]: JSON.stringify(metadata)
      }

      chain.forEach((link, index) => {
        headers[`${AUTH_CHAIN_HEADER_PREFIX}${index}`] = JSON.stringify(link)
      })

      const response = await fetch(`${authApiUrl}${path}`, {
        method,
        headers,
        // The auth API validates the ephemeral identity by deriving an address
        // from the private key (ethers.Wallet) and comparing it to the provided
        // address. The ephemeral key is short-lived and NOT the user's wallet key.
        body: JSON.stringify({ identity: currentIdentity }),
        signal: AbortSignal.timeout(5000)
      })

      if (!response.ok) {
        throw new Error(`Auth API responded with status ${response.status}`)
      }

      const data: IdentityApiResponse = await response.json()
      return data.data?.identityId ?? data.identityId
    } catch (error) {
      console.error('Failed to create identity ID:', error)
      return undefined
    }
  }, [])
}
