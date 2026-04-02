import { useCallback } from 'react'
import { Authenticator } from '@dcl/crypto/dist/Authenticator'
import { Env, getEnv } from '@dcl/ui-env'
import { useAuthIdentity } from './useAuthIdentity'

const AUTH_CHAIN_HEADER_PREFIX = 'x-identity-auth-chain-'
const AUTH_TIMESTAMP_HEADER = 'x-identity-timestamp'
const AUTH_METADATA_HEADER = 'x-identity-metadata'

type UseGetIdentityIdResult = {
  getIdentityId: () => Promise<string | undefined>
  authLoading: boolean
}

export function useGetIdentityId(): UseGetIdentityIdResult {
  const { identity, loading } = useAuthIdentity()

  const getIdentityId = useCallback(async (): Promise<string | undefined> => {
    if (!identity?.authChain || !identity?.ephemeralIdentity) {
      return undefined
    }

    try {
      const authApiUrl = getEnv() === Env.DEVELOPMENT ? 'https://auth-api.decentraland.zone' : 'https://auth-api.decentraland.org'

      const method = 'POST'
      const path = '/identities'
      const metadata = { signer: 'dcl:auth', intent: 'dcl:auth:create-identity' }
      const timestamp = String(Date.now())
      const payload = [method, path, timestamp, JSON.stringify(metadata)].join(':').toLowerCase()

      const chain = Authenticator.signPayload(identity, payload)
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
        body: JSON.stringify({ identity })
      })

      if (!response.ok) {
        throw new Error(`Auth API responded with status ${response.status}`)
      }

      const data = await response.json()
      return data.data?.identityId ?? data.identityId
    } catch (error) {
      console.error('Failed to create identity ID:', error)
      return undefined
    }
  }, [identity])

  return { getIdentityId, authLoading: loading }
}
