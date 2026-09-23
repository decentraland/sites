import { collectCampaignParams } from '../../modules/campaignParams'
import { attachMacArchHint } from '../../modules/macArchHint'
import { SegmentEvent } from '../../modules/segment'
import { readDataAttributes } from './readDataAttributes'

/**
 * Assembles the shared Click payload consumed by both click adapters —
 * `useTrackClick` (deferred transport) and `useDownloadClick` (beacon
 * transport). Keeping this in one place stops the two adapters from drifting.
 *
 * Merge order: the current URL's campaign (utm_*) params first, then `extra`
 * (adapter-specific fields such as the download click-correlation), then the
 * element's `data-*` attributes last so the trusted, component-controlled
 * values win on any collision. The camelCased utm_* keys never collide with
 * `data-*`-derived keys because `readDataAttributes` camelCases dashed names.
 *
 * Also strips a redundant `event === 'Click'` (it would only repeat the event
 * name) and renames the camelCased `downloadTarget` attribute to the
 * snake_case `download_target` warehouse dimension.
 */
function buildClickPayload(currentTarget: Element, extra: Record<string, unknown> = {}): Record<string, unknown> {
  const { downloadTarget, ...dataAttributes } = readDataAttributes(currentTarget)
  // Intentional precedence: campaign params are the weakest source, `extra` can
  // override them, and the element's own `data-*` attributes are spread last so
  // component-controlled values always win a key collision.
  const payload: Record<string, unknown> = {
    ...collectCampaignParams(),
    ...extra,
    ...dataAttributes
  }

  if (payload.event === SegmentEvent.CLICK) {
    delete payload.event
  }

  if (downloadTarget) {
    payload.download_target = downloadTarget

    // Mac-only architecture hint (GPU-based; the UA lies about the chip).
    // Only download CTAs pay the (memoized) WebGL read — see macArchHint.
    attachMacArchHint(payload)
  }

  return payload
}

export { buildClickPayload }
