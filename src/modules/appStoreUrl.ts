/**
 * App Store Connect's limit on the campaign token (`ct`). Longer tokens are not reported.
 */
const APP_STORE_CAMPAIGN_TOKEN_MAX_LENGTH = 40

/**
 * Derives the App Store campaign token from the visitor's campaign params as
 * `<utm_source>-<utm_campaign>`, dropping whichever is missing. Returns null when neither is
 * present, so the caller keeps the base URL's default token.
 */
function buildAppStoreCampaignToken(campaignParams: Record<string, string>): string | null {
  const token = [campaignParams.utm_source, campaignParams.utm_campaign]
    .filter(Boolean)
    .join('-')
    .slice(0, APP_STORE_CAMPAIGN_TOKEN_MAX_LENGTH)
    .replace(/[-_]+$/, '')
  return token || null
}

/**
 * Sets the App Store campaign token (`ct`) from the visitor's campaign params. App Store Connect
 * groups installs by `ct` (App Analytics > Sources > Campaigns) and ignores utm_*, so without this
 * every iOS install reports the base URL's default token whatever campaign brought the visitor.
 * `pt` (provider token) and `mt` (media type) are kept as they are on the base URL.
 */
function buildAppStoreUrl(baseUrl: string, campaignParams: Record<string, string>): string {
  const token = buildAppStoreCampaignToken(campaignParams)
  if (!token) return baseUrl
  const url = new URL(baseUrl)
  url.searchParams.set('ct', token)
  return url.toString()
}

export { APP_STORE_CAMPAIGN_TOKEN_MAX_LENGTH, buildAppStoreUrl }
