import { postDeferredClick } from './deferredClickBeacon'
import { postSegmentEvent } from './segmentBeacon'

jest.mock('./segmentBeacon', () => ({ postSegmentEvent: jest.fn() }))

describe('when a click made before analytics was ready is sent through the beacon', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    postDeferredClick({ place: 'Landing Navbar', action: 'learn' })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
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
