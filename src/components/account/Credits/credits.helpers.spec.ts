import { getEnv } from '../../../config/env'
import { buildCreditsSignupUrl, openCreditsSignup } from './credits.helpers'

jest.mock('../../../config/env', () => ({
  getEnv: jest.fn()
}))

const mockGetEnv = getEnv as jest.Mock

describe('credits.helpers', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('buildCreditsSignupUrl', () => {
    describe('when MARKETPLACE_URL is set without a trailing slash', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://market.example.org')
      })

      it('should append the /credits path', () => {
        expect(buildCreditsSignupUrl()).toBe('https://market.example.org/credits')
      })
    })

    describe('when MARKETPLACE_URL has a trailing slash', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://market.example.org/')
      })

      it('should not produce a double slash', () => {
        expect(buildCreditsSignupUrl()).toBe('https://market.example.org/credits')
      })
    })

    describe('when MARKETPLACE_URL is missing', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue(undefined)
      })

      it('should throw', () => {
        expect(() => buildCreditsSignupUrl()).toThrow('MARKETPLACE_URL environment variable is not set')
      })
    })
  })

  describe('openCreditsSignup', () => {
    let openSpy: jest.SpyInstance

    beforeEach(() => {
      mockGetEnv.mockReturnValue('https://market.example.org')
      openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
    })

    afterEach(() => {
      openSpy.mockRestore()
    })

    it('should open the signup URL in a new tab', () => {
      openCreditsSignup()

      expect(openSpy).toHaveBeenCalledWith('https://market.example.org/credits', '_blank', 'noopener,noreferrer')
    })
  })
})
