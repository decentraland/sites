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

/**
 * Whether /places drops the Featured rail entirely, leaving the curated picks to appear in the
 * Explore grid like any other place.
 *
 * The two flags are independent by construction. Nothing is ever hidden by turning this one on: the
 * grid reads `/destinations`, which returns `highlighted DESC` first, so the curated set sits at the
 * head of the feed either way. What the layout flag does is subtract whatever the rails already
 * showed from that grid, and with no rail rendering there is nothing to subtract.
 *
 *  - layout flag OFF: places repeat across sections regardless, so this one only removes the rail.
 *  - layout flag ON + this OFF: Featured renders in its rail and is subtracted from the grid (today).
 *  - layout flag ON + this ON: no rail, no subtraction, and the curated picks lead the grid.
 *
 * Default off, which is the rail production ships. Named for hiding rather than showing so that an
 * in-flight or failed flag fetch resolves to the section still being there.
 */
function useHideFeaturedPlaces(): boolean {
  return useRemoteFeatureFlag(FEATURE_FLAG.placesHideFeaturedSection)
}

/** @internal — exported for testing (see discover.flags.spec.ts); not part of this module's public contract. */
const resetDiscoverFlagsForTests = resetFeatureFlagsForTests

export { resetDiscoverFlagsForTests, useHideFeaturedPlaces, useNewPlacesLayout }
