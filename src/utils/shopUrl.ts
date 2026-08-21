import { getEnv } from '../config/env'

/**
 * Links to the Shop — where collectibles are browsed and bought now.
 *
 * The Marketplace still owns everything else (LAND, estates, ENS names, the transfer flow, a creator's
 * account page), so this is a per-asset redirect rather than a base-URL swap: only the assets the Shop has
 * a page for come here, and the rest keep pointing where they already did.
 */

const FALLBACK = 'https://decentraland.org/shop'

/**
 * Categories the Shop can actually render.
 *
 * This is the whole reason the callers ask before rewriting a link. A profile's assets include names,
 * parcels and estates alongside wearables and emotes, and the Shop has no page for any of those three — a
 * blanket rewrite would send a LAND owner to a Shop URL that resolves to nothing. Marketplace `category`
 * values, matched exactly.
 */
const SHOP_CATEGORIES = new Set(['wearable', 'emote'])

function isShopCategory(category?: string | null): boolean {
  return !!category && SHOP_CATEGORIES.has(category)
}

function shopBase(): string {
  return (getEnv('SHOP_URL') ?? FALLBACK).replace(/\/+$/, '')
}

/**
 * The generic page for an ITEM — every copy of a wearable, the one a buyer browses to.
 *
 * `/item/:contractAddress/:itemId`, the Shop's own route (decentraland/shop `App.tsx`). Deliberately built
 * from the two ids rather than by rewriting the Marketplace path the API also returns: parsing a URL to
 * produce a URL fails silently when the shape changes, and both ids are already on every row.
 */
function shopItemUrl(contractAddress: string, itemId: string): string {
  return `${shopBase()}/item/${contractAddress}/${itemId}`
}

/**
 * The page for ONE COPY — a specific token, which is what a profile's assets are.
 *
 * Token ids are 78-digit decimals. They are passed through as the strings they arrive as and must never be
 * put through anything numeric on the way: `Number` silently rounds them, and the result is a valid-looking
 * id for somebody else's token.
 */
function shopTokenUrl(contractAddress: string, tokenId: string): string {
  return `${shopBase()}/token/${contractAddress}/${tokenId}`
}

export { isShopCategory, shopItemUrl, shopTokenUrl }
