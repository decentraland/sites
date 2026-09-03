import { resetFeatureFlagsForTests, useRemoteFeatureFlag, useRemoteFeatureFlagVariant } from '../../modules/featureFlagStore'
import { FEATURE_FLAG } from '../../modules/ff'

// IMPORTANT: this module must only be imported from the discover route chunk (the heavy DappsShell
// tier). Keeping the flag fetch inside that lazy chunk is what stops the homepage from shipping
// feature-flag bytes (see CLAUDE.md — homepage Lighthouse budget).

// What the LIVE section requires when the flag is off, absent, or carries no usable number: anybody
// at all in the scene (the 2026-09-01 product decision). A failed flag fetch therefore keeps the
// rail as generous as it is today rather than emptying it.
/** @internal — exported for testing (see discover.flags.spec.ts); not part of this module's public contract. */
const DEFAULT_LIVE_MIN_USERS = 1

/**
 * Whether a place may appear in more than one section of /places. ON: a scene that qualifies shows
 * in Live Now, then again in Featured, then again in the Explore grid. OFF (the default): it shows in
 * the first section it qualifies for and nowhere else, unless a search or category filter is active,
 * because a query must never hide results.
 *
 * This is the only thing the flag decides. It used to also switch the Live Now source, the LIVE
 * threshold and the badge semantics, which meant turning "repeat" off on an environment silently
 * emptied the rail; those are now unconditional or carry their own flag.
 */
function useRepeatAcrossSections(): boolean {
  return useRemoteFeatureFlag(FEATURE_FLAG.placesRepeatCrossSections)
}

/**
 * How many people a scene needs in it to count as LIVE, read from the `min_users` variant of
 * `dapps-places-live-min-user`. The service can serve the flag for a host without its variant (zone
 * does), and the payload is a string an operator typed into Unleash, so only a plain positive integer
 * counts: whitespace around it is tolerated (the live file already ships payloads with a trailing
 * newline), but "2.5", "1e3" or "5px" fall back to DEFAULT_LIVE_MIN_USERS rather than being guessed.
 */
function useLiveMinUsers(): number {
  const raw = useRemoteFeatureFlagVariant(FEATURE_FLAG.placesLiveMinUsers)?.trim()
  if (raw === undefined || !/^\d+$/.test(raw)) return DEFAULT_LIVE_MIN_USERS
  const parsed = Number(raw)
  return parsed >= 1 ? parsed : DEFAULT_LIVE_MIN_USERS
}

/**
 * Whether /places drops the Featured rail entirely, leaving the curated picks to appear in the
 * Explore grid like any other place.
 *
 * Independent of the repeat flag by construction. Nothing is ever hidden by turning this one on: the
 * grid reads `/destinations`, which returns `highlighted DESC` first, so the curated set sits at the
 * head of the feed either way. Deduplication only subtracts what a rail actually rendered, and with no
 * rail rendering there is nothing to subtract.
 *
 * Default off, which is the rail production ships. Named for hiding rather than showing so that an
 * in-flight or failed flag fetch resolves to the section still being there.
 */
function useHideFeaturedPlaces(): boolean {
  return useRemoteFeatureFlag(FEATURE_FLAG.placesHideFeaturedSection)
}

/** @internal — exported for testing (see discover.flags.spec.ts); not part of this module's public contract. */
const resetDiscoverFlagsForTests = resetFeatureFlagsForTests

export { DEFAULT_LIVE_MIN_USERS, resetDiscoverFlagsForTests, useHideFeaturedPlaces, useLiveMinUsers, useRepeatAcrossSections }
