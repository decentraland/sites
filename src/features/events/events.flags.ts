import { useRemoteFeatureFlag } from '../../modules/featureFlagStore'
import { FEATURE_FLAG } from '../../modules/ff'

// IMPORTANT: this module must only be imported from the events route chunk (the heavy DappsShell
// tier). Keeping the flag fetch inside that lazy chunk is what stops the homepage from shipping
// feature-flag bytes (see CLAUDE.md — homepage Lighthouse budget).

/**
 * Whether the event form offers a featured-wearables field at all.
 *
 * Default off, and off means no field: neither the search picker nor the plain URN input it replaced
 * is rendered, and the same applies during the flag fetch. A `featured_item` already saved on the
 * event is untouched — edit hydration keeps it in form state and submit still sends it — it simply
 * cannot be seen or edited while the flag is off.
 */
function useEventFeaturedItemSearch(): boolean {
  return useRemoteFeatureFlag(FEATURE_FLAG.eventFeaturedItemSearch)
}

export { useEventFeaturedItemSearch }
