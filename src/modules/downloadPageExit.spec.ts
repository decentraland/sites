import { markDownloadCtaClicked, resetDownloadCtaClicked, sendDownloadPageExit } from './downloadPageExit'
import { SegmentEvent } from './segment'
import { postSegmentEvent } from './segmentBeacon'

jest.mock('./segmentBeacon', () => ({ postSegmentEvent: jest.fn() }))
jest.mock('./segmentAnonymousId', () => ({ ensureSegmentAnonymousId: () => 'anon-fixed' }))

describe('when sending the download page exit event', () => {
  beforeEach(() => {
    resetDownloadCtaClicked()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should report cta_clicked false when no download CTA was clicked', () => {
    sendDownloadPageExit(1200)
    expect(postSegmentEvent).toHaveBeenCalledWith(
      SegmentEvent.DOWNLOAD_PAGE_EXIT,
      expect.objectContaining({ cta_clicked: false, ms_on_page: 1200 }),
      'anon-fixed'
    )
  })

  it('should report cta_clicked true after markDownloadCtaClicked', () => {
    markDownloadCtaClicked()
    sendDownloadPageExit(500)
    expect(postSegmentEvent).toHaveBeenCalledWith(
      SegmentEvent.DOWNLOAD_PAGE_EXIT,
      expect.objectContaining({ cta_clicked: true }),
      'anon-fixed'
    )
  })

  it('should reset the flag with resetDownloadCtaClicked', () => {
    markDownloadCtaClicked()
    resetDownloadCtaClicked()
    sendDownloadPageExit(10)
    expect(postSegmentEvent).toHaveBeenCalledWith(
      SegmentEvent.DOWNLOAD_PAGE_EXIT,
      expect.objectContaining({ cta_clicked: false }),
      'anon-fixed'
    )
  })
})
