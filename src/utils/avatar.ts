import type { Avatar } from '@dcl/schemas'

const ETH_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/

function isValidEthAddress(address: string | undefined | null): address is string {
  return typeof address === 'string' && ETH_ADDRESS_REGEX.test(address)
}

function formatEthAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

interface MinimalAvatarInput {
  name: string
  ethAddress: string
  faceUrl?: string
}

// `decentraland-ui2`'s AvatarFace only reads `name`, `ethAddress`, and
// `avatar.snapshots.face256`; the rest of @dcl/schemas' Avatar (userId,
// bodyShape, wearables, emotes, ...) is not needed at this boundary.
// Confining the structural cast to one factory keeps call-sites honest and
// guarantees every consumer receives a fully-shaped object — missing
// `snapshots` on the returned object throws at render time.
//
// Addresses that don't match `0x` + 40 hex are sanitized to '' so a
// compromised upstream cannot path-traverse through `getProfileFaceUrl`
// or the profile deep-link.
function buildMinimalAvatar(input: MinimalAvatarInput): Avatar {
  const safeEthAddress = isValidEthAddress(input.ethAddress) ? input.ethAddress : ''
  return {
    name: input.name,
    ethAddress: safeEthAddress,
    avatar: { snapshots: { face256: input.faceUrl ?? '', body: '' } }
  } as unknown as Avatar
}

export { buildMinimalAvatar, formatEthAddress, isValidEthAddress }
