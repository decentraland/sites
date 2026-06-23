// `assetUrl` prepends the deploy base (`VITE_BASE_URL`) to public-folder asset
// paths. On CDN deploys (master/releases) the SPA is served from
// `cdn.decentraland.org/sites/<version>` while the HTML lives on the page
// origin, so a raw `/images/...` path resolves against the origin and 404s.
// Routing through `assetUrl` keeps those assets pointing at the CDN base.

const ORIGINAL_BASE = process.env.VITE_BASE_URL

async function loadAssetUrl(base: string | undefined): Promise<(path: string) => string> {
  if (base === undefined) {
    delete process.env.VITE_BASE_URL
  } else {
    process.env.VITE_BASE_URL = base
  }
  jest.resetModules()
  const mod = await import('./assetUrl')
  return mod.assetUrl
}

describe('assetUrl', () => {
  afterEach(() => {
    if (ORIGINAL_BASE === undefined) {
      delete process.env.VITE_BASE_URL
    } else {
      process.env.VITE_BASE_URL = ORIGINAL_BASE
    }
    jest.resetModules()
  })

  describe('when VITE_BASE_URL is a CDN url', () => {
    it('should prepend the CDN base to the asset path', async () => {
      const assetUrl = await loadAssetUrl('https://cdn.decentraland.org/sites/1.2.3')

      expect(assetUrl('/images/referrals/referral-envelope.webp')).toBe(
        'https://cdn.decentraland.org/sites/1.2.3/images/referrals/referral-envelope.webp'
      )
    })

    it('should not produce a double slash when the base has a trailing slash', async () => {
      const assetUrl = await loadAssetUrl('https://cdn.decentraland.org/sites/1.2.3/')

      expect(assetUrl('/images/referrals/tier_1.webp')).toBe('https://cdn.decentraland.org/sites/1.2.3/images/referrals/tier_1.webp')
    })

    it('should add a leading slash to paths that lack one', async () => {
      const assetUrl = await loadAssetUrl('https://cdn.decentraland.org/sites/1.2.3')

      expect(assetUrl('images/referrals/sports-medal.webp')).toBe(
        'https://cdn.decentraland.org/sites/1.2.3/images/referrals/sports-medal.webp'
      )
    })
  })

  describe('when VITE_BASE_URL is empty (localhost / Vercel / Cloudflare)', () => {
    it('should return the origin-relative path unchanged', async () => {
      const assetUrl = await loadAssetUrl('')

      expect(assetUrl('/images/referrals/referral-envelope.webp')).toBe('/images/referrals/referral-envelope.webp')
    })
  })

  describe('when VITE_BASE_URL is not defined', () => {
    it('should return the origin-relative path unchanged', async () => {
      const assetUrl = await loadAssetUrl(undefined)

      expect(assetUrl('/images/referrals/referral-envelope.webp')).toBe('/images/referrals/referral-envelope.webp')
    })
  })
})
