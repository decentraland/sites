import type { Profile } from 'dcl-catalyst-client/dist/client/specs/lambdas-client'

/**
 * Inviter's display name from a Catalyst profile, or `null` when the profile
 * hasn't resolved (or carries no usable name).
 *
 * Shared by the hero heading and the document title so the page never shows the
 * inviter one way and the tab another.
 */
function getInviterName(profile: Profile | null | undefined): string | null {
  const name = profile?.avatars?.[0]?.name?.trim()
  return name ? name : null
}

export { getInviterName }
