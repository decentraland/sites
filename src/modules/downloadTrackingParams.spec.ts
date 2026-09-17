import { REFERRER_STORAGE_KEY } from '../utils/referrer'
import { collectCampaignParams } from './campaignParams'
import { buildDownloadTrackingParams } from './downloadTrackingParams'

jest.mock('./campaignParams', () => ({ collectCampaignParams: jest.fn(() => ({})) }))

const mockedCollectCampaignParams = collectCampaignParams as jest.MockedFunction<typeof collectCampaignParams>

const VALID_REFERRER = '0x1234567890abcdef1234567890abcdef12345678'
const CHECKSUMMED_REFERRER = '0x1234567890AbCdEf1234567890aBcDeF12345678'

describe('buildDownloadTrackingParams', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/')
    window.sessionStorage.clear()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should merge the campaign params with the anon_user_id', () => {
    mockedCollectCampaignParams.mockReturnValue({ utm_source: 'shefi' })

    expect(buildDownloadTrackingParams('anon-1')).toEqual({ utm_source: 'shefi', anon_user_id: 'anon-1' })
  })

  it('should include the deep-link params when provided', () => {
    mockedCollectCampaignParams.mockReturnValue({})

    expect(buildDownloadTrackingParams('anon-1', { position: '10,20', realm: 'x.dcl.eth' })).toEqual({
      position: '10,20',
      realm: 'x.dcl.eth',
      anon_user_id: 'anon-1'
    })
  })

  it('should pass through an undefined anon_user_id', () => {
    mockedCollectCampaignParams.mockReturnValue({})

    expect(buildDownloadTrackingParams(undefined)).toEqual({ anon_user_id: undefined })
  })

  describe('when the referral referrer rides on the current URL', () => {
    beforeEach(() => {
      mockedCollectCampaignParams.mockReturnValue({})
    })

    it('should include it alongside the deep-link params, lowercased', () => {
      window.history.replaceState({}, '', `/jump?position=10,20&referrer=${CHECKSUMMED_REFERRER}`)

      expect(buildDownloadTrackingParams('anon-1', { position: '10,20' })).toEqual({
        position: '10,20',
        anon_user_id: 'anon-1',
        referrer: VALID_REFERRER
      })
    })

    it('should omit it when the param is not an address', () => {
      window.history.replaceState({}, '', '/jump?referrer=not-an-address')

      expect(buildDownloadTrackingParams('anon-1')).toEqual({ anon_user_id: 'anon-1' })
    })

    // The builder runs during render on every route the navbar mounts, so it must
    // not clear the invite flow's stored attribution the way `resolveReferrer` does.
    it('should leave the stored referrer untouched when the param is not an address', () => {
      window.sessionStorage.setItem(REFERRER_STORAGE_KEY, VALID_REFERRER)
      window.history.replaceState({}, '', '/jump?referrer=not-an-address')

      buildDownloadTrackingParams('anon-1')

      expect(window.sessionStorage.getItem(REFERRER_STORAGE_KEY)).toBe(VALID_REFERRER)
    })

    // `/download` resolves the stored value itself, so inheriting it here would
    // attribute a download started anywhere in the tab to an earlier referral.
    it('should not inherit the stored referrer when the URL carries no param', () => {
      window.sessionStorage.setItem(REFERRER_STORAGE_KEY, VALID_REFERRER)

      expect(buildDownloadTrackingParams('anon-1')).toEqual({ anon_user_id: 'anon-1' })
    })
  })
})
