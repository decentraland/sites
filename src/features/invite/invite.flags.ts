import { resetFeatureFlagsForTests, useRemoteFeatureFlag } from '../../modules/featureFlagStore'
import { FEATURE_FLAG } from '../../modules/ff'
import { isDirectDownloadEnabled } from '../../utils/referrer'

// IMPORTANT: this module must only be imported from the invite route chunk (InvitePage /
// InviteHero). The flag fetch is intentionally scoped to that lazy chunk so the homepage ships zero
// feature-flag bytes and fires zero feature-flag requests (see CLAUDE.md — homepage Lighthouse budget).

/**
 * Whether the invite direct-download flow is enabled: the per-environment
 * configuration gate AND the remote `dapps-invite-direct-download` flag.
 * Returns false until the remote flag loads (default off — the CTA renders
 * the auth-login-first flow, which also registers the referral).
 */
function useInviteDirectDownload(): boolean {
  const remoteEnabled = useRemoteFeatureFlag(FEATURE_FLAG.inviteDirectDownload)
  return remoteEnabled && isDirectDownloadEnabled()
}

/** @internal — exported for testing (see invite.flags.spec.ts); not part of this module's public contract. */
const resetInviteFlagsForTests = resetFeatureFlagsForTests

export { resetInviteFlagsForTests, useInviteDirectDownload }
