import {
  JOIN_EMAIL_REQUIRED_ERROR,
  JOIN_GENERIC_ERROR,
  OPT_OUT_ALREADY_CLAIMED_ERROR,
  OPT_OUT_GENERIC_ERROR,
  mapJoinErrorToI18nKey,
  mapOptOutErrorToI18nKey
} from './credits.errors'

describe('mapOptOutErrorToI18nKey', () => {
  describe('when the error is undefined', () => {
    it('should map to the generic error key', () => {
      expect(mapOptOutErrorToI18nKey(undefined)).toBe(OPT_OUT_GENERIC_ERROR)
    })
  })

  describe('when the server message mentions already claimed credits', () => {
    it('should map to the already-claimed error key', () => {
      const error = { status: 400, data: { message: 'You have already claimed credits this week' } }
      expect(mapOptOutErrorToI18nKey(error)).toBe(OPT_OUT_ALREADY_CLAIMED_ERROR)
    })

    it('should read the message from the error field as a fallback', () => {
      const error = { status: 409, data: { error: 'claimed credits already' } }
      expect(mapOptOutErrorToI18nKey(error)).toBe(OPT_OUT_ALREADY_CLAIMED_ERROR)
    })
  })

  describe('when the server error is unrelated', () => {
    it('should map to the generic error key', () => {
      const error = { status: 500, data: { message: 'Internal server error' } }
      expect(mapOptOutErrorToI18nKey(error)).toBe(OPT_OUT_GENERIC_ERROR)
    })
  })

  describe('when the error has no parseable body', () => {
    it('should map to the generic error key', () => {
      const error = { status: 'FETCH_ERROR' as const, error: 'Network request failed' }
      expect(mapOptOutErrorToI18nKey(error)).toBe(OPT_OUT_GENERIC_ERROR)
    })
  })

  describe('when the error is a serialized error without a status', () => {
    it('should map to the generic error key', () => {
      const error = { name: 'Error', message: 'boom' }
      expect(mapOptOutErrorToI18nKey(error)).toBe(OPT_OUT_GENERIC_ERROR)
    })
  })
})

describe('mapJoinErrorToI18nKey', () => {
  it('should map the missing-email rejection to the email-required key', () => {
    const error = { status: 400, data: { error: 'User must be subscribed to notifications with a valid email' } }
    expect(mapJoinErrorToI18nKey(error)).toBe(JOIN_EMAIL_REQUIRED_ERROR)
  })

  it('should map unrelated server errors to the generic key', () => {
    const error = { status: 500, data: { message: 'Internal server error' } }
    expect(mapJoinErrorToI18nKey(error)).toBe(JOIN_GENERIC_ERROR)
  })

  it('should map an undefined error to the generic key', () => {
    expect(mapJoinErrorToI18nKey(undefined)).toBe(JOIN_GENERIC_ERROR)
  })
})
