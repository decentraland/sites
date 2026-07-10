import { renderHook } from '@testing-library/react'
import { buildDownloadSuccessHref } from '../modules/url'
import { useAnonUserId } from './useAnonUserId'
import { useDownloadSuccessHref } from './useDownloadSuccessHref'

// buildDownloadSuccessHref's URL-construction logic (including campaignParams)
// is already exhaustively unit-tested in url.test.ts. This spec only asserts
// the hook's wiring: does it call the builder with the right anonUserId and
// campaign params collected off the current URL.
jest.mock('../modules/url', () => ({ buildDownloadSuccessHref: jest.fn(() => '/download_success?stub') }))

jest.mock('./useAnonUserId', () => ({ useAnonUserId: jest.fn() }))

const mockUseAnonUserId = jest.mocked(useAnonUserId)
const mockBuildDownloadSuccessHref = jest.mocked(buildDownloadSuccessHref)

describe('useDownloadSuccessHref', () => {
  afterEach(() => {
    jest.resetAllMocks()
    window.history.pushState({}, '', '/')
  })

  describe('when there is no anon_user_id and no campaign params', () => {
    it('should call buildDownloadSuccessHref with the given os/place and an empty campaignParams object', () => {
      mockUseAnonUserId.mockReturnValue(undefined)
      const { result } = renderHook(() => useDownloadSuccessHref())

      result.current('Windows', 'landing-hero')

      expect(mockBuildDownloadSuccessHref).toHaveBeenCalledWith('Windows', 'landing-hero', {
        anonUserId: undefined,
        campaignParams: {}
      })
    })
  })

  describe('when there is an anon_user_id', () => {
    it('should forward it to buildDownloadSuccessHref', () => {
      mockUseAnonUserId.mockReturnValue('anon-123')
      const { result } = renderHook(() => useDownloadSuccessHref())

      result.current('Windows', 'landing-hero')

      expect(mockBuildDownloadSuccessHref).toHaveBeenCalledWith(
        'Windows',
        'landing-hero',
        expect.objectContaining({ anonUserId: 'anon-123' })
      )
    })
  })

  describe('when the page URL carries partner campaign params', () => {
    it('should collect them at CALL time, not render time', () => {
      // pushState AFTER renderHook: pins that collectCampaignParams runs when
      // the returned builder is invoked. A refactor hoisting collection into
      // the hook body (captured at render) would break this — and would lose
      // attribution on SPA navigations that change the query string.
      mockUseAnonUserId.mockReturnValue(undefined)
      const { result } = renderHook(() => useDownloadSuccessHref())

      window.history.pushState({}, '', '/?utm_org=dcl&utm_source=shefi&utm_campaign=partner-launch')
      result.current('Windows', 'landing-hero')

      expect(mockBuildDownloadSuccessHref).toHaveBeenCalledWith(
        'Windows',
        'landing-hero',
        expect.objectContaining({ campaignParams: { utm_org: 'dcl', utm_source: 'shefi', utm_campaign: 'partner-launch' } })
      )
    })
  })

  it('should return whatever buildDownloadSuccessHref produces', () => {
    mockUseAnonUserId.mockReturnValue(undefined)
    mockBuildDownloadSuccessHref.mockReturnValue('/download_success?os=Windows&place=landing-hero')
    const { result } = renderHook(() => useDownloadSuccessHref())

    expect(result.current('Windows', 'landing-hero')).toBe('/download_success?os=Windows&place=landing-hero')
  })
})
