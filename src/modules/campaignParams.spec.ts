import { collectCampaignParams } from './campaignParams'

// Mirrors the module-private cap in campaignParams.ts; asserted here as the
// documented, stable public behavior (a partner cannot flood the warehouse).
const MAX_CAMPAIGN_VALUE_LENGTH = 256

describe('collectCampaignParams', () => {
  describe('when the source is a URLSearchParams instance', () => {
    it('should collect every present utm param', () => {
      expect(
        collectCampaignParams(new URLSearchParams('utm_source=shefi&utm_medium=email&utm_campaign=launch&utm_content=hero&utm_term=web3'))
      ).toEqual({
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
