import { collectCampaignParams, withCampaignParams, withCampaignParamsOverlay } from './campaignParams'

// Mirrors the module-private cap in campaignParams.ts; asserted here as the
// documented, stable public behavior (a partner cannot flood the warehouse).
const MAX_CAMPAIGN_VALUE_LENGTH = 256

describe('collectCampaignParams', () => {
  describe('when the source is a URLSearchParams instance', () => {
    it('should collect every present utm param', () => {
      expect(
        collectCampaignParams(
          new URLSearchParams('utm_org=dcl&utm_source=shefi&utm_medium=email&utm_campaign=launch&utm_content=hero&utm_term=web3')
        )
      ).toEqual({
        utm_org: 'dcl',
        utm_source: 'shefi',
        utm_medium: 'email',
        utm_campaign: 'launch',
        utm_content: 'hero',
        utm_term: 'web3'
      })
    })

    it('should omit params that are absent rather than emitting empty strings', () => {
      expect(collectCampaignParams(new URLSearchParams('utm_source=shefi'))).toEqual({ utm_source: 'shefi' })
    })

    it('should ignore non-campaign params', () => {
      expect(collectCampaignParams(new URLSearchParams('os=Windows&place=download-page&foo=bar'))).toEqual({})
    })

    it('should omit params that are present but empty', () => {
      expect(collectCampaignParams(new URLSearchParams('utm_source=&utm_campaign=launch'))).toEqual({ utm_campaign: 'launch' })
    })

    it('should normalize values according to the UTM builder rules', () => {
      expect(
        collectCampaignParams(
          new URLSearchParams(
            'utm_org=DCL&utm_source=IG Stories&utm_medium=PaidSocial&utm_campaign=Brand.Launch&utm_content=15 secs&utm_term=selfdiscovery%26growth'
          )
        )
      ).toEqual({
        utm_org: 'dcl',
        utm_source: 'ig_stories',
        utm_medium: 'paidsocial',
        utm_campaign: 'brandlaunch',
        utm_content: '15_secs',
        utm_term: 'selfdiscoverygrowth'
      })
    })

    it('should cap each value at MAX_CAMPAIGN_VALUE_LENGTH so a hostile link cannot flood the warehouse', () => {
      const long = 'x'.repeat(MAX_CAMPAIGN_VALUE_LENGTH + 50)
      expect(collectCampaignParams(new URLSearchParams(`utm_source=${long}`)).utm_source).toHaveLength(MAX_CAMPAIGN_VALUE_LENGTH)
    })
  })

  describe('when no source is given', () => {
    it('should read the campaign params off the current window location', () => {
      window.history.pushState({}, '', '/download?utm_source=partner&utm_campaign=q3')
      try {
        expect(collectCampaignParams()).toEqual({ utm_source: 'partner', utm_campaign: 'q3' })
      } finally {
        window.history.pushState({}, '', '/')
      }
    })
  })
})

describe('withCampaignParams', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/')
  })

  describe('when the current URL has no campaign params', () => {
    it('should return the path unchanged', () => {
      expect(withCampaignParams('/download')).toBe('/download')
    })
  })

  describe('when the current URL carries campaign params', () => {
    beforeEach(() => {
      window.history.pushState({}, '', '/?utm_org=dcl&utm_source=shefi&utm_campaign=partner-launch')
    })

    it('should append them to a plain path', () => {
      expect(withCampaignParams('/download')).toBe('/download?utm_org=dcl&utm_source=shefi&utm_campaign=partner-launch')
    })

    it('should append with & when the path already has a query string', () => {
      expect(withCampaignParams('/download?foo=bar')).toBe('/download?foo=bar&utm_org=dcl&utm_source=shefi&utm_campaign=partner-launch')
    })

    it('should ignore non-campaign params on the current URL', () => {
      window.history.pushState({}, '', '/?utm_source=shefi&os=evil')
      expect(withCampaignParams('/download')).toBe('/download?utm_source=shefi')
    })
  })
})

describe('withCampaignParamsOverlay', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/')
  })

  describe('when the current URL has no campaign params', () => {
    it('should return the base URL unchanged', () => {
      const baseUrl = 'https://play.google.com/store/apps/details?id=org.decentraland.godotexplorer&utm_source=fdn'
      expect(withCampaignParamsOverlay(baseUrl)).toBe(baseUrl)
    })
  })

  describe('when the current URL carries campaign params', () => {
    beforeEach(() => {
      window.history.pushState({}, '', '/?utm_source=x&utm_medium=paid&utm_campaign=ad')
    })

    it('should override same-named params already present on the base URL', () => {
      const baseUrl =
        'https://play.google.com/store/apps/details?id=org.decentraland.godotexplorer&utm_org=dclrgl&utm_source=fdn&utm_medium=qr&utm_campaign=dclpage&utm_content=android'
      const result = new URL(withCampaignParamsOverlay(baseUrl))
      expect(result.searchParams.get('utm_source')).toBe('x')
      expect(result.searchParams.get('utm_medium')).toBe('paid')
      expect(result.searchParams.get('utm_campaign')).toBe('ad')
    })

    it('should preserve params not part of the campaign allowlist', () => {
      const baseUrl = 'https://play.google.com/store/apps/details?id=org.decentraland.godotexplorer&utm_source=fdn'
      const result = new URL(withCampaignParamsOverlay(baseUrl))
      expect(result.searchParams.get('id')).toBe('org.decentraland.godotexplorer')
    })
  })
})
