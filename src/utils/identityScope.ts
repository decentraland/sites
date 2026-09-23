import type { AuthIdentity } from '@dcl/crypto'

const identityAddress = (identity: AuthIdentity | undefined): string | undefined => identity?.authChain?.[0]?.payload?.toLowerCase()

export { identityAddress }
