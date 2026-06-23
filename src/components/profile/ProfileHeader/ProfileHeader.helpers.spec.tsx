import { getFriendButtonConfig } from './ProfileHeader.helpers'

describe('getFriendButtonConfig', () => {
  describe('when a friend request has been sent', () => {
    it('should offer the cancel action with the request-sent label', () => {
      const config = getFriendButtonConfig('request_sent')

      expect(config.action).toBe('cancel')
      expect(config.labelKey).toBe('profile.header.request_sent')
      expect(config.icon).toBeDefined()
    })
  })

  describe('when a friend request has been received', () => {
    it('should offer the accept action with the add-friend label', () => {
      const config = getFriendButtonConfig('request_received')

      expect(config.action).toBe('accept')
      expect(config.labelKey).toBe('profile.header.add_friend')
    })
  })

  describe('when the friendship is accepted', () => {
    it('should offer the remove action with the remove-friend label', () => {
      const config = getFriendButtonConfig('accepted')

      expect(config.action).toBe('remove')
      expect(config.labelKey).toBe('profile.header.remove_friend')
    })
  })

  describe('when there is no relationship yet', () => {
    it('should default to the request action with the add-friend label', () => {
      const config = getFriendButtonConfig('none')

      expect(config.action).toBe('request')
      expect(config.labelKey).toBe('profile.header.add_friend')
    })
  })

  describe('when the user is blocked', () => {
    it('should fall through to the request action with the add-friend label', () => {
      const config = getFriendButtonConfig('blocked')

      expect(config.action).toBe('request')
      expect(config.labelKey).toBe('profile.header.add_friend')
    })
  })

  describe('when the status is undefined', () => {
    it('should fall through to the request action default', () => {
      const config = getFriendButtonConfig(undefined)

      expect(config.action).toBe('request')
      expect(config.labelKey).toBe('profile.header.add_friend')
    })
  })
})
