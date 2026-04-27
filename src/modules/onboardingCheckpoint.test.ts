import { trackCheckpoint } from './onboardingCheckpoint'

describe('trackCheckpoint', () => {
  let mockTrack: jest.Mock

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when called with a valid anonUserId', () => {
    beforeEach(() => {
      mockTrack = jest.fn()
      trackCheckpoint(mockTrack, {
        checkpointId: 1,
        action: 'reached',
        anonUserId: 'anon-uuid-1'
      })
    })

    it('should call track with the correct event name', () => {
      expect(mockTrack).toHaveBeenCalledWith('Onboarding Checkpoint', expect.any(Object))
    })

    it('should include the checkpointId, action and source', () => {
      expect(mockTrack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ checkpointId: 1, action: 'reached', source: 'landing' })
      )
    })

    it('should set userIdentifier to the anonUserId with identifierType=anon', () => {
      expect(mockTrack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userIdentifier: 'anon-uuid-1',
          identifierType: 'anon'
        })
      )
    })
  })

  describe('when called with metadata', () => {
    beforeEach(() => {
      mockTrack = jest.fn()
      trackCheckpoint(mockTrack, {
        checkpointId: 1,
        anonUserId: 'anon-uuid-1',
        metadata: { os: 'macos' }
      })
    })

    it('should include the metadata in the tracked data', () => {
      expect(mockTrack).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ metadata: { os: 'macos' } }))
    })
  })

  describe('when action is not provided', () => {
    beforeEach(() => {
      mockTrack = jest.fn()
      trackCheckpoint(mockTrack, {
        checkpointId: 1,
        anonUserId: 'anon-uuid-1'
      })
    })

    it('should default the action to reached', () => {
      expect(mockTrack).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ action: 'reached' }))
    })
  })

  describe('when anonUserId is missing', () => {
    beforeEach(() => {
      mockTrack = jest.fn()
      trackCheckpoint(mockTrack, {
        checkpointId: 1
      })
    })

    it('should not call track', () => {
      expect(mockTrack).not.toHaveBeenCalled()
    })
  })
})
