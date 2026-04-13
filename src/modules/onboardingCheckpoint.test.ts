import { trackCheckpoint } from './onboardingCheckpoint'

describe('trackCheckpoint', () => {
  let mockTrack: jest.Mock

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when called with a valid email identifier', () => {
    beforeEach(() => {
      mockTrack = jest.fn()
      trackCheckpoint(mockTrack, {
        checkpointId: 5,
        action: 'reached',
        email: 'user@example.com'
      })
    })

    it('should call track with the correct event name', () => {
      expect(mockTrack).toHaveBeenCalledWith('Onboarding Checkpoint', expect.any(Object))
    })

    it('should include the checkpointId in the tracked data', () => {
      expect(mockTrack).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ checkpointId: 5 }))
    })

    it('should include the action in the tracked data', () => {
      expect(mockTrack).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ action: 'reached' }))
    })

    it('should set the userIdentifier to the email', () => {
      expect(mockTrack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userIdentifier: 'user@example.com',
          identifierType: 'email',
          email: 'user@example.com'
        })
      )
    })

    it('should set the source to landing', () => {
      expect(mockTrack).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ source: 'landing' }))
    })
  })

  describe('when called with a valid wallet identifier', () => {
    beforeEach(() => {
      mockTrack = jest.fn()
      trackCheckpoint(mockTrack, {
        checkpointId: 6,
        action: 'completed',
        wallet: '0x1234567890abcdef1234567890abcdef12345678'
      })
    })

    it('should call track with the wallet as userIdentifier', () => {
      expect(mockTrack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userIdentifier: '0x1234567890abcdef1234567890abcdef12345678',
          identifierType: 'wallet'
        })
      )
    })

    it('should not include email in the tracked data', () => {
      expect(mockTrack).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ email: undefined }))
    })
  })

  describe('when called with metadata', () => {
    beforeEach(() => {
      mockTrack = jest.fn()
      trackCheckpoint(mockTrack, {
        checkpointId: 5,
        email: 'user@example.com',
        metadata: { campaign: 'summer2026' }
      })
    })

    it('should include the metadata in the tracked data', () => {
      expect(mockTrack).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ metadata: { campaign: 'summer2026' } }))
    })
  })

  describe('when action is not provided', () => {
    beforeEach(() => {
      mockTrack = jest.fn()
      trackCheckpoint(mockTrack, {
        checkpointId: 5,
        email: 'user@example.com'
      })
    })

    it('should default the action to reached', () => {
      expect(mockTrack).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ action: 'reached' }))
    })
  })

  describe('when no userIdentifier can be resolved', () => {
    beforeEach(() => {
      mockTrack = jest.fn()
      trackCheckpoint(mockTrack, {
        checkpointId: 5
      })
    })

    it('should not call track', () => {
      expect(mockTrack).not.toHaveBeenCalled()
    })
  })

  describe('when the email does not match the expected regex', () => {
    beforeEach(() => {
      mockTrack = jest.fn()
      trackCheckpoint(mockTrack, {
        checkpointId: 5,
        email: 'invalid-email'
      })
    })

    it('should not call track', () => {
      expect(mockTrack).not.toHaveBeenCalled()
    })
  })

  describe('when the wallet does not match the expected regex', () => {
    beforeEach(() => {
      mockTrack = jest.fn()
      trackCheckpoint(mockTrack, {
        checkpointId: 6,
        wallet: '0xSHORT'
      })
    })

    it('should not call track', () => {
      expect(mockTrack).not.toHaveBeenCalled()
    })
  })

  describe('when the wallet has an invalid hex character', () => {
    beforeEach(() => {
      mockTrack = jest.fn()
      trackCheckpoint(mockTrack, {
        checkpointId: 6,
        wallet: '0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ'
      })
    })

    it('should not call track', () => {
      expect(mockTrack).not.toHaveBeenCalled()
    })
  })

  describe('when both email and wallet are provided', () => {
    describe('and the email is valid', () => {
      beforeEach(() => {
        mockTrack = jest.fn()
        trackCheckpoint(mockTrack, {
          checkpointId: 5,
          email: 'user@example.com',
          wallet: '0x1234567890abcdef1234567890abcdef12345678'
        })
      })

      it('should prefer email over wallet as the identifier', () => {
        expect(mockTrack).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            userIdentifier: 'user@example.com',
            identifierType: 'email'
          })
        )
      })
    })

    describe('and the email is invalid', () => {
      beforeEach(() => {
        mockTrack = jest.fn()
        trackCheckpoint(mockTrack, {
          checkpointId: 5,
          email: 'not-an-email',
          wallet: '0x1234567890abcdef1234567890abcdef12345678'
        })
      })

      it('should fall back to the wallet as the identifier', () => {
        expect(mockTrack).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            userIdentifier: '0x1234567890abcdef1234567890abcdef12345678',
            identifierType: 'wallet'
          })
        )
      })
    })
  })
})
