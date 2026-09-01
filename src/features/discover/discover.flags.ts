import { resetFeatureFlagsForTests, useRemoteFeatureFlag } from '../../modules/featureFlagStore'
import { FEATURE_FLAG } from '../../modules/ff'

// IMPORTANT: this module must only be imported from the discover route chunk (the heavy DappsShell
// tier). Keeping the flag fetch inside that lazy chunk is what stops the homepage from shipping
// feature-flag bytes (see CLAUDE.md — homepage Lighthouse budget).

/**
 * Whether a place may appear only once across the Live Now rail, the Featured rail and the Explore
 * grid.
 *
 * NOTE: the remote flag is named `dapps-places-repeat-cross-sections` but its ON state means "do
 * NOT repeat" — the name reads inverted against the behaviour it switches on. The hook is named
 * after what it returns so no caller has to remember that. Do not rename either one without
 * checking the flag's value in the service first.
 *
 * Default off, and off is the behaviour production already ships: every highlighted place appears
 * in Featured AND at the head of the grid (the API returns `highlighted DESC` first, so the overlap
 * is total, 22 of 22 today), and a highlighted place with people also appears in the Live rail — the
 * same card three times. So a failed or in-flight flag fetch degrades to today's page rather than
 * to a half-deduped one.
 */
function usePlacesDedupeCrossSections(): boolean {
  return useRemoteFeatureFlag(FEATURE_FLAG.placesRepeatCrossSections)
}

/** @internal — exported for testing (see discover.flags.spec.ts); not part of this module's public contract. */
const resetDiscoverFlagsForTests = resetFeatureFlagsForTests

export { resetDiscoverFlagsForTests, usePlacesDedupeCrossSections }
