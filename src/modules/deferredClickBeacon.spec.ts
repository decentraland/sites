import { postDeferredClick } from './deferredClickBeacon'
import { ensureSegmentAnonymousId } from './segmentAnonymousId'
import { postSegmentEvent } from './segmentBeacon'

jest.mock('./segmentBeacon', () => ({ postSegmentEvent: jest.fn() }))
jest.mock('./segmentAnonymousId', () => ({ ensureSegmentAnonymousId: jest.fn() }))

describe('when a click made before analytics was ready is sent through the beacon', () => {
  beforeEach(() => {
    ;(ensureSegmentAnonymousId as jest.Mock).mockReturnValue('anon-1')
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    postDeferredClick({ place: 'Landing Navbar', action: 'learn' })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  it('should send a Click with the deferral fields every deferred click carries', () => {
    expect(postSegmentEvent).toHaveBeenCalledWith(
      'Click',
      {
        place: 'Landing Navbar',
        action: 'learn',
        track_called_at: 1_700_000_000_000,
        track_delivered_at: 1_700_000_000_000,
        track_deferred: true
      },
      'anon-1'
    )
  })
})
