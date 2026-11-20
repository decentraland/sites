/**
 * @jest-environment node
 */
import { APP_STORE_CAMPAIGN_TOKEN_MAX_LENGTH, buildAppStoreUrl } from './appStoreUrl'

const BASE = 'https://apps.apple.com/app/apple-store/id6478403840?pt=126284288&ct=Decentraland%20Home%20iOS&mt=8'

const campaignTokenOf = (url: string) => new URL(url).searchParams.get('ct')

describe('when building an App Store URL', () => {
  let campaignParams: Record<string, string>
  let result: string

  describe('and no campaign params are given', () => {
    beforeEach(() => {
      campaignParams = {}
      result = buildAppStoreUrl(BASE, campaignParams)
    })

    it('should return the base URL with its default campaign token untouched', () => {
      expect(result).toBe(BASE)
    })
  })

  describe('and only campaign params other than source and campaign are given', () => {
    beforeEach(() => {
      campaignParams = { utm_medium: 'paid', utm_content: 'video' }
      result = buildAppStoreUrl(BASE, campaignParams)
    })

    it('should return the base URL with its default campaign token untouched', () => {
      expect(result).toBe(BASE)
    })
  })

  describe('and both a source and a campaign are given', () => {
    beforeEach(() => {
      campaignParams = { utm_source: 'tiktok', utm_medium: 'paid', utm_campaign: 'halloweeks' }
      result = buildAppStoreUrl(BASE, campaignParams)
    })

    it('should set the campaign token to the source and the campaign joined by a dash', () => {
      expect(result).toBe('https://apps.apple.com/app/apple-store/id6478403840?pt=126284288&ct=tiktok-halloweeks&mt=8')
    })
  })

  describe('and only a source is given', () => {
    beforeEach(() => {
      campaignParams = { utm_source: 'tiktok' }
      result = buildAppStoreUrl(BASE, campaignParams)
    })

    it('should set the campaign token to the source alone', () => {
      expect(campaignTokenOf(result)).toBe('tiktok')
    })
  })

  describe('and only a campaign is given', () => {
    beforeEach(() => {
      campaignParams = { utm_campaign: 'halloweeks' }
      result = buildAppStoreUrl(BASE, campaignParams)
    })

    it('should set the campaign token to the campaign alone', () => {
      expect(campaignTokenOf(result)).toBe('halloweeks')
    })
  })

  describe('and the joined token is longer than the App Store limit', () => {
    beforeEach(() => {
      campaignParams = { utm_source: 'tiktok', utm_campaign: 'halloweeks_2026_global_retargeting_lookalike_v2' }
      result = buildAppStoreUrl(BASE, campaignParams)
    })

    it('should truncate the campaign token to the App Store limit', () => {
      expect(campaignTokenOf(result)).toBe('tiktok-halloweeks_2026_global_retargetin')
    })

    it('should keep the campaign token within the App Store limit', () => {
      expect(campaignTokenOf(result)?.length).toBe(APP_STORE_CAMPAIGN_TOKEN_MAX_LENGTH)
    })
  })

  describe('and the truncation cut lands on a separator', () => {
    beforeEach(() => {
      campaignParams = { utm_source: 'a'.repeat(APP_STORE_CAMPAIGN_TOKEN_MAX_LENGTH - 1), utm_campaign: 'halloweeks' }
      result = buildAppStoreUrl(BASE, campaignParams)
    })

    it('should drop the trailing separator from the campaign token', () => {
      expect(campaignTokenOf(result)).toBe('a'.repeat(APP_STORE_CAMPAIGN_TOKEN_MAX_LENGTH - 1))
    })
  })

  describe('and the values were already normalized by the campaign params collector', () => {
    beforeEach(() => {
      campaignParams = { utm_source: 'partner_x', utm_campaign: 'fall-launch' }
      result = buildAppStoreUrl(BASE, campaignParams)
    })

    it('should use the values unchanged in the campaign token', () => {
      expect(campaignTokenOf(result)).toBe('partner_x-fall-launch')
    })
  })

  describe('and a campaign token is set', () => {
    beforeEach(() => {
      campaignParams = { utm_source: 'tiktok', utm_campaign: 'halloweeks' }
      result = buildAppStoreUrl(BASE, campaignParams)
    })

    it('should keep the provider token and the media type from the base URL', () => {
      const url = new URL(result)
      expect([url.searchParams.get('pt'), url.searchParams.get('mt')]).toEqual(['126284288', '8'])
    })
  })
})
