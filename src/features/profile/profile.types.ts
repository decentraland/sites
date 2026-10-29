// Flattened view of a Catalyst profile — the handful of fields the avatar and name
// surfaces actually render. Distinct from the raw `Profile` the lambdas return, which
// carries the full avatar payload.
interface ProfileSummary {
  address: string
  name?: string
  hasClaimedName: boolean
  avatarFace256?: string
}

interface ProfileNameResponse {
  data?: { nfts?: { name?: string; owner?: { address?: string } }[] }
  errors?: unknown
}

export type { ProfileNameResponse, ProfileSummary }
