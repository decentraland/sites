import { collectCampaignParams } from './campaignParams'
import { buildDownloadTrackingParams } from './downloadTrackingParams'

jest.mock('./campaignParams', () => ({ collectCampaignParams: jest.fn(() => ({})) }))

const mockedCollectCampaignParams = collectCampaignParams as jest.MockedFunction<typeof collectCampaignParams>

describe('buildDownloadTrackingParams', () => {
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
})
