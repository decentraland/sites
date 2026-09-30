// Plain ESM with no imports and no browser globals, so the site (through Vite) and
// scripts/build-llms-txt.mjs (through Node, at build time) load this same file. Types live in the
// sibling googlePlayUrl.d.ts.
//
// Keep it plain JavaScript. Node imports it directly during `npm run build` and cannot load
// TypeScript, so converting it to .ts breaks the build. It is the reason jest and eslint allow JS.

/**
 * Overlays `utmParams` onto the Play Store base URL, then mirrors the final utm_* set into a
 * `referrer` param.
 *
 * The bare utm_* params only tag the store-page visit (Play Console acquisition reports). Campaign
 * attribution for the INSTALL travels through the Play Install Referrer API, which reads the
 * `referrer` query param: without it, no install can ever be joined back to a campaign, no matter
 * what the URL's utm_* say.
 *
 * @param {string} baseUrl
 * @param {Record<string, string>} utmParams
 * @returns {string}
 */
function buildGooglePlayUrl(baseUrl, utmParams) {
  const url = new URL(baseUrl)
  for (const [key, value] of Object.entries(utmParams)) {
    url.searchParams.set(key, value)
  }
  const referrer = new URLSearchParams()
  for (const [key, value] of url.searchParams.entries()) {
    if (key.startsWith('utm_')) {
      referrer.append(key, value)
    }
  }
  // URLSearchParams.set percent-encodes the nested query string on serialization
  // (`utm_source%3D…%26utm_medium%3D…`), the format the Install Referrer API expects.
  url.searchParams.set('referrer', referrer.toString())
  return url.toString()
}

export { buildGooglePlayUrl }
