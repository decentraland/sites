import { SEGMENT_TRACK_URL, getSegmentWriteKey } from './segmentConfig'

let mockWriteKey: string
let mockExempt: boolean

jest.mock('../config/env', () => ({
  getEnv: () => mockWriteKey
}))

jest.mock('../utils/isAnalyticsExemptPath', () => ({
  isAnalyticsExemptPath: () => mockExempt
}))

describe('segmentConfig', () => {
  beforeEach(() => {
    mockWriteKey = 'wk-test'
    mockExempt = false
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('SEGMENT_TRACK_URL', () => {
    it('should point at the Segment HTTP Tracking API track endpoint', () => {
      expect(SEGMENT_TRACK_URL).toBe('https://api.segment.io/v1/track')
    })
  })

  describe('getSegmentWriteKey', () => {
    it('should return the configured write key on a non-exempt path', () => {
      expect(getSegmentWriteKey()).toBe('wk-test')
    })

    it('should return an empty string on an analytics-exempt path', () => {
      mockExempt = true
      expect(getSegmentWriteKey()).toBe('')
    })

    it('should return an empty string when no write key is configured', () => {
      mockWriteKey = ''
      expect(getSegmentWriteKey()).toBe('')
    })
  })
})
