import { REJECTION_REASON_MAX_LENGTH } from '../../features/whats-on/admin/admin.types'
import { buildRejectionReason } from './PendingEventsPage.helpers'

const t = (key: string) => key

describe('buildRejectionReason', () => {
  describe('when no reasons and no notes are provided', () => {
    it('should return an empty string', () => {
      expect(buildRejectionReason([], '', t)).toBe('')
    })
  })

  describe('when only reasons are provided', () => {
    it('should join translated reason titles with a comma', () => {
      const result = buildRejectionReason(['invalid_image', 'invalid_duration'], '', t)
      expect(result).toBe(
        'whats_on_admin.reject_modal.reasons.invalid_image.title, whats_on_admin.reject_modal.reasons.invalid_duration.title'
      )
    })
  })

  describe('when only notes are provided', () => {
    it('should return the trimmed notes', () => {
      expect(buildRejectionReason([], '  inappropriate content  ', t)).toBe('inappropriate content')
    })
  })

  describe('when reasons and notes are provided', () => {
    it('should join titles with comma and append notes after a period separator', () => {
      const result = buildRejectionReason(['invalid_image'], 'extra detail', t)
      expect(result).toBe('whats_on_admin.reject_modal.reasons.invalid_image.title. extra detail')
    })
  })

  describe('when the combined output exceeds the backend max length', () => {
    it(`should truncate to ${REJECTION_REASON_MAX_LENGTH} characters`, () => {
      const longNotes = 'x'.repeat(2000)
      const result = buildRejectionReason(['invalid_image'], longNotes, t)
      expect(result).toHaveLength(REJECTION_REASON_MAX_LENGTH)
    })
  })

  describe('when notes are whitespace only', () => {
    it('should drop the notes segment', () => {
      const result = buildRejectionReason(['invalid_image'], '   \n\t  ', t)
      expect(result).toBe('whats_on_admin.reject_modal.reasons.invalid_image.title')
    })
  })
})
