import type { ComponentType, ReactNode } from 'react'
import type { CatalogCardProps as BaseCatalogCardProps } from 'decentraland-ui2/dist/components/CatalogCard/CatalogCard.types'
import { CatalogCard as BaseCatalogCard } from 'decentraland-ui2'

// Bridge type to accept the props from decentraland/ui2#440 ("catalog card info badges slot
// and content gap bump") before that PR ships to npm. The local ui2 tgz install honours these
// slots; the published `decentraland-ui2@3.8.0` silently ignores them. Drop this shim and
// switch back to a direct `decentraland-ui2` import once a published ui2 version exposes the
// new props.
interface CatalogCardProps extends BaseCatalogCardProps {
  /** Always-visible badges rendered next to the RarityBadge (e.g. wearable category icons). */
  infoBadges?: ReactNode
  /** Replaces the default `<AssetAddress>` below the title. Pass `null` to hide. */
  creatorSlot?: ReactNode
  /** Full-width block revealed at the bottom of the card on hover (e.g. a "BUY" button). */
  bottomAction?: ReactNode
  /** Skips the hover reveal of the info expansion. */
  disableInfoExpansion?: boolean
  /** Fade the RarityBadge out while hovered (lets `bottomAction` take its visual slot). */
  hideRarityOnHover?: boolean
  /** Shadow style on hover. */
  hoverShadow?: 'default' | 'glow'
  /** URN of the asset to preview on hover — emotes play, wearables dress the avatar (requires an `AssetPreviewPlayerProvider` above). */
  hoverPreviewUrn?: string
  /** When true, renders the rarity tag as a subdued pastel chip. */
  subduedRarity?: boolean
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const CatalogCard = BaseCatalogCard as unknown as ComponentType<CatalogCardProps>

export { CatalogCard }
export type { CatalogCardProps }
