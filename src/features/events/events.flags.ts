import { useRemoteFeatureFlag } from '../../modules/featureFlagStore'
import { FEATURE_FLAG } from '../../modules/ff'

// IMPORTANT: this module must only be imported from the events route chunk (the heavy DappsShell
// tier). Keeping the flag fetch inside that lazy chunk is what stops the homepage from shipping
// feature-flag bytes (see CLAUDE.md — homepage Lighthouse budget).

/**
 * Whether the event form's featured-wearables field is the marketplace search picker.
 *
 * Default off — and off is not "no field": it is the previous behaviour, a plain text input that
 * accepts a pasted item or collection URN. So a failed or slow flag fetch degrades to what
 * production already shipped rather than removing the field.
 */
function useEventFeaturedItemSearch(): boolean {
  return useRemoteFeatureFlag(FEATURE_FLAG.eventFeaturedItemSearch)
}

export { useEventFeaturedItemSearch }
