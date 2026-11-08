import { isAnalyticsOffForVisitor } from './analyticsSessionGate'
import { postDeferredClick } from './deferredClickBeacon'
import { postSegmentEvent } from './segmentBeacon'

jest.mock('./segmentBeacon', () => ({ postSegmentEvent: jest.fn() }))
jest.mock('./analyticsSessionGate', () => ({ isAnalyticsOffForVisitor: jest.fn() }))

describe('when a click made before analytics was ready is sent through the beacon', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  describe('and analytics is on for the visitor', () => {
    beforeEach(() => {
      ;(isAnalyticsOffForVisitor as jest.Mock).mockReturnValue(false)
      jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
      postDeferredClick({ place: 'Landing Navbar', action: 'learn' })
    })

    it('should send a Click with the deferral fields every deferred click carries, leaving the anonymous id to the transport', () => {
      expect(postSegmentEvent).toHaveBeenCalledWith('Click', {
        place: 'Landing Navbar',
        action: 'learn',
        track_called_at: 1_700_000_000_000,
        track_delivered_at: 1_700_000_000_000,
        track_deferred: true
      })
    })
  })

  describe('and analytics stays off for the visitor (exempt session or bot)', () => {
    beforeEach(() => {
      ;(isAnalyticsOffForVisitor as jest.Mock).mockReturnValue(true)
    })

    it('should send nothing for a click that is not a conversion', () => {
      postDeferredClick({ place: 'Landing Navbar', action: 'learn' })
      expect(postSegmentEvent).not.toHaveBeenCalled()
    })

    it('should still send a conversion click', () => {
      postDeferredClick({ place: 'download-page' }, { isConversion: true })
      expect(postSegmentEvent).toHaveBeenCalledTimes(1)
    })
  })
})
