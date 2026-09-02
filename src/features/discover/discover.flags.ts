import { resetFeatureFlagsForTests, useRemoteFeatureFlag } from '../../modules/featureFlagStore'
import { FEATURE_FLAG } from '../../modules/ff'

// IMPORTANT: this module must only be imported from the discover route chunk (the heavy DappsShell
// tier). Keeping the flag fetch inside that lazy chunk is what stops the homepage from shipping
// feature-flag bytes (see CLAUDE.md — homepage Lighthouse budget).

/**
 * Whether /places renders the layout product specified on 2026-09-01, replacing the one this page
 * shipped with. Four changes travel together, which is why one flag switches all of them:
 *
 * - LIVE is any scene with at least one person, not five. `LIVE_MIN_USERS` is legacy-path only.
 * - A scene that qualifies for LIVE renders ONLY there, carrying its Featured badge along with it,
 *   instead of repeating in the Featured rail and again at the head of the grid.
 * - The red LIVE badge means an event is running (`live` from `with_live_events`), not people.
 * - The rail reads presence from the destinations feed rather than joining three services client
 *   side, so the web and the explorer order the same rows from the same source.
 *
 * NOTE: the remote flag is still named `dapps-places-repeat-cross-sections`, from when this only
 * switched the repetition. Its ON state has always meant "the new behaviour"; the scope grew, the
 * name did not. The hook is named for what it gates so no caller has to know that.
 *
 * Default off, and off is the behaviour production already ships. An in-flight or failed flag fetch
 * resolves to off, so the page degrades to today rather than to a half-applied redesign.
 */
function useNewPlacesLayout(): boolean {
  return useRemoteFeatureFlag(FEATURE_FLAG.placesRepeatCrossSections)
}

/** @internal — exported for testing (see discover.flags.spec.ts); not part of this module's public contract. */
const resetDiscoverFlagsForTests = resetFeatureFlagsForTests

export { resetDiscoverFlagsForTests, useNewPlacesLayout }
