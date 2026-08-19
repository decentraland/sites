import { DEFAULT_SEGMENT_TRACK_URL, getSegmentApiHost, getSegmentCdnUrl, getSegmentTrackUrl, getSegmentWriteKey } from './segmentConfig'

let mockEnvValues: Record<string, string>
let mockExempt: boolean

jest.mock('../config/env', () => ({
  getEnv: (key: string) => mockEnvValues[key] ?? ''
}))

jest.mock('../utils/isAnalyticsExemptPath', () => ({
  isAnalyticsExemptPath: () => mockExempt
}))

describe('segmentConfig', () => {
  beforeEach(() => {
    mockEnvValues = { SEGMENT_KEY: 'wk-test' }
    mockExempt = false
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('DEFAULT_SEGMENT_TRACK_URL', () => {
    it('should point at the Segment HTTP Tracking API track endpoint', () => {
      expect(DEFAULT_SEGMENT_TRACK_URL).toBe('https://api.segment.io/v1/track')
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
      mockEnvValues = {}
      expect(getSegmentWriteKey()).toBe('')
    })

    describe('and the exempt-path gate is bypassed', () => {
      beforeEach(() => {
        mockExempt = true
      })

      it('should return the write key on an analytics-exempt path', () => {
        expect(getSegmentWriteKey({ bypassExemptPathGate: true })).toBe('wk-test')
      })

      it('should still return an empty string when no write key is configured', () => {
        mockEnvValues = {}
        expect(getSegmentWriteKey({ bypassExemptPathGate: true })).toBe('')
      })

      it('should keep the gate active when the flag is explicitly false', () => {
        expect(getSegmentWriteKey({ bypassExemptPathGate: false })).toBe('')
      })
    })
  })

  describe('getSegmentCdnUrl', () => {
    it('should return undefined when SEGMENT_CDN_URL is not configured', () => {
      expect(getSegmentCdnUrl()).toBeUndefined()
    })

    it('should return the configured CDN URL', () => {
      mockEnvValues.SEGMENT_CDN_URL = 'https://evs.e.decentraland.org'
      expect(getSegmentCdnUrl()).toBe('https://evs.e.decentraland.org')
    })

    it('should return undefined when the value is an empty string', () => {
      mockEnvValues.SEGMENT_CDN_URL = ''
      expect(getSegmentCdnUrl()).toBeUndefined()
    })

    it('should drop the trailing slash, the settings path is appended to it', () => {
      mockEnvValues.SEGMENT_CDN_URL = 'https://evs.e.decentraland.org/'
      expect(getSegmentCdnUrl()).toBe('https://evs.e.decentraland.org')
    })

    it('should keep the path the proxy serves it from', () => {
      mockEnvValues.SEGMENT_CDN_URL = 'https://evs.e.decentraland.org/aPath'
      expect(getSegmentCdnUrl()).toBe('https://evs.e.decentraland.org/aPath')
    })

    describe('when the configured value cannot be trusted', () => {
      let consoleWarn: jest.SpyInstance

      beforeEach(() => {
        consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})
      })

      afterEach(() => {
        consoleWarn.mockRestore()
      })

      it('should warn and ignore it when it is not served over https', () => {
        mockEnvValues.SEGMENT_CDN_URL = 'http://evs.e.decentraland.org'
        expect(getSegmentCdnUrl()).toBeUndefined()
        expect(consoleWarn).toHaveBeenCalled()
      })

      it('should warn and ignore it when it is not a valid URL', () => {
        mockEnvValues.SEGMENT_CDN_URL = 'evs.e.decentraland.org'
        expect(getSegmentCdnUrl()).toBeUndefined()
        expect(consoleWarn).toHaveBeenCalled()
      })
    })
  })

  describe('getSegmentApiHost', () => {
    it('should return undefined when SEGMENT_API_HOST is not configured', () => {
      expect(getSegmentApiHost()).toBeUndefined()
    })

    it('should return the configured API host', () => {
      mockEnvValues.SEGMENT_API_HOST = 'evs.e.decentraland.org/v1'
      expect(getSegmentApiHost()).toBe('evs.e.decentraland.org/v1')
    })

    it('should return undefined when the value is an empty string', () => {
      mockEnvValues.SEGMENT_API_HOST = ''
      expect(getSegmentApiHost()).toBeUndefined()
    })

    it('should strip the protocol when it carries one, the SDK prepends its own', () => {
      mockEnvValues.SEGMENT_API_HOST = 'https://evs.e.decentraland.org/v1'
      expect(getSegmentApiHost()).toBe('evs.e.decentraland.org/v1')
    })

    it('should return the bare host when it carries no base path', () => {
      mockEnvValues.SEGMENT_API_HOST = 'evs.e.decentraland.org'
      expect(getSegmentApiHost()).toBe('evs.e.decentraland.org')
    })

    describe('when the configured value cannot be trusted', () => {
      let consoleWarn: jest.SpyInstance

      beforeEach(() => {
        consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})
      })

      afterEach(() => {
        consoleWarn.mockRestore()
      })

      it('should warn and ignore it when it is not served over https', () => {
        mockEnvValues.SEGMENT_API_HOST = 'http://evs.e.decentraland.org/v1'
        expect(getSegmentApiHost()).toBeUndefined()
        expect(consoleWarn).toHaveBeenCalled()
      })

      it('should warn and ignore it when it is not a valid URL', () => {
        mockEnvValues.SEGMENT_API_HOST = 'http://['
        expect(getSegmentApiHost()).toBeUndefined()
        expect(consoleWarn).toHaveBeenCalled()
      })
    })
  })

  describe('getSegmentTrackUrl', () => {
    it('should return the default Segment track URL when SEGMENT_API_HOST is not configured', () => {
      expect(getSegmentTrackUrl()).toBe('https://api.segment.io/v1/track')
    })

    it('should derive the track URL from SEGMENT_API_HOST when configured', () => {
      mockEnvValues.SEGMENT_API_HOST = 'evs.e.decentraland.org/v1'
      expect(getSegmentTrackUrl()).toBe('https://evs.e.decentraland.org/v1/track')
    })

    it('should return the default track URL when SEGMENT_API_HOST is an empty string', () => {
      mockEnvValues.SEGMENT_API_HOST = ''
      expect(getSegmentTrackUrl()).toBe('https://api.segment.io/v1/track')
    })

    it('should return the default track URL when SEGMENT_API_HOST is rejected', () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})
      mockEnvValues.SEGMENT_API_HOST = 'http://evs.e.decentraland.org/v1'
      expect(getSegmentTrackUrl()).toBe('https://api.segment.io/v1/track')
      consoleWarn.mockRestore()
    })
  })

  // Guards the shipped configuration itself, not the helpers: the CDN host and the
  // Tracking API host are two different proxies and swapping them silently sends
  // every event to a 404, which no unit test on mocked env values would catch.
  describe('the configured environments', () => {
    const envs: [string, Record<string, string | undefined>][] = [
      ['dev', jest.requireActual('../config/env/dev.json')],
      ['stg', jest.requireActual('../config/env/stg.json')],
      ['prd', jest.requireActual('../config/env/prd.json')]
    ]

    describe.each(envs.filter(([, env]) => env.SEGMENT_CDN_URL))('%s', (_envName, env) => {
      it('should point SEGMENT_CDN_URL at an absolute https origin', () => {
        expect(env.SEGMENT_CDN_URL).toMatch(/^https:\/\//)
        expect(new URL(env.SEGMENT_CDN_URL!).pathname).toBe('/')
      })
    })

    // The three env files carried the same write key from april 2026 (added in #216) until #747,
    // so every .zone visit and every preview deploy wrote into the production source. stg keeps
    // sharing it on purpose, mirroring marketplace, but dev must not go back to it by copy-paste.
    it('should keep dev on its own Segment source, away from production', () => {
      const dev = envs.find(([name]) => name === 'dev')![1]
      const prd = envs.find(([name]) => name === 'prd')![1]
      expect(dev.SEGMENT_KEY).not.toBe(prd.SEGMENT_KEY)
    })

    describe.each(envs.filter(([, env]) => env.SEGMENT_API_HOST))('%s', (_envName, env) => {
      it('should point SEGMENT_API_HOST at a host and base path, with no protocol', () => {
        expect(env.SEGMENT_API_HOST).toMatch(/^[a-z0-9.-]+\/[a-z0-9]+$/)
      })

      it('should not reuse the CDN host for the ingestion, they are separate proxies', () => {
        expect(env.SEGMENT_API_HOST!.split('/')[0]).not.toBe(new URL(env.SEGMENT_CDN_URL!).host)
      })
    })
  })
})
