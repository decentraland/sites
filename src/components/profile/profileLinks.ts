/**
 * Where the profile's owner CTAs send someone, for destinations that are not this app.
 *
 * Same-origin paths rather than absolute URLs, so a visitor stays on the environment they are already on
 * (.zone / .today / .org) — the Shop is served by-path at <domain>/shop, so the browser navigates for real
 * and lands on the matching deployment. An absolute .org link would drop a .zone tester into production.
 */

/**
 * "Get a Unique Name", shown to an owner with no claimed NAME.
 *
 * NAMEs are bought in the Shop. This pointed at the Builder, which is where a NAME is managed once you
 * have one — the wrong room for somebody who is here precisely because they do not.
 *
 * `?category=names` is the Shop's NAMEs surface; the navbar's own NAMEs entry uses the same one.
 */
export const GET_A_NAME_URL = '/shop/items?category=names'

/**
 * "Manage World", shown to an owner who already holds a NAME.
 *
 * Worlds are published and managed in the Builder, so unlike the Shop link above this one is absolute and
 * per-environment — hence a function reading config rather than a constant.
 */
export function manageWorldUrl(builderUrl: string | undefined): string | undefined {
  return builderUrl ? `${builderUrl.replace(/\/+$/, '')}/worlds` : undefined
}
