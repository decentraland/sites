import { resetFeatureFlagsForTests, useRemoteFeatureFlag } from '../../modules/featureFlagStore'
import { FEATURE_FLAG } from '../../modules/ff'

// IMPORTANT: this module must only be imported from the invite route chunk (InvitePage /
// InviteHero). The flag fetch is intentionally scoped to that lazy chunk so the homepage ships zero
// feature-flag bytes and fires zero feature-flag requests (see CLAUDE.md — homepage Lighthouse budget).

/**
 * Whether the invite direct-download flow is enabled.
 *
 * The `dapps-invite-direct-download` feature flag is the single source of truth.
 * NOTE (2026-08-31): this used to be ANDed with an `INVITE_DIRECT_DOWNLOAD` env
 * gate, which silently overrode the flag — production shipped with the gate off,
 * so turning the flag on changed nothing and switching environments needed a
 * release. The flag already targets per host, so the gate only added a second,
 * slower switch. Don't reintroduce it.
 *
 * Returns false until the flag loads (default off — the CTA renders the
 * auth-login-first flow, which also registers the referral).
 */
function useInviteDirectDownload(): boolean {
  return useRemoteFeatureFlag(FEATURE_FLAG.inviteDirectDownload)
}

/** @internal — exported for testing (see invite.flags.spec.ts); not part of this module's public contract. */
const resetInviteFlagsForTests = resetFeatureFlagsForTests

export { resetInviteFlagsForTests, useInviteDirectDownload }
