import { EMOJI_SHORTCODES, replaceEmojiShortcodes } from './emojiShortcodes'

describe('replaceEmojiShortcodes', () => {
  describe('when text contains a known shortcode', () => {
    it('should replace it with the matching emoji', () => {
      expect(replaceEmojiShortcodes(':popcorn:')).toBe('🍿')
    })

    it('should be case-insensitive', () => {
      expect(replaceEmojiShortcodes(':POPCORN:')).toBe('🍿')
    })
  })

  describe('when text contains an unknown shortcode', () => {
    it('should leave it untouched', () => {
      expect(replaceEmojiShortcodes(':not_a_real_thing:')).toBe(':not_a_real_thing:')
    })
  })

  describe('when text contains multiple shortcodes', () => {
    it('should replace each one and preserve surrounding text', () => {
      expect(replaceEmojiShortcodes(':tada: launch :rocket: ship :fire:')).toBe('🎉 launch 🚀 ship 🔥')
    })
  })

  describe('when text has no shortcodes', () => {
    it('should return the original string', () => {
      expect(replaceEmojiShortcodes('plain text with no codes')).toBe('plain text with no codes')
    })
  })

  describe('shortcode map', () => {
    it('should expose the popcorn entry', () => {
      expect(EMOJI_SHORTCODES.get('popcorn')).toBe('🍿')
    })

    it('should map +1 / -1 alphanumeric variants', () => {
      expect(EMOJI_SHORTCODES.get('+1')).toBe('👍')
      expect(EMOJI_SHORTCODES.get('-1')).toBe('👎')
    })
  })
})
