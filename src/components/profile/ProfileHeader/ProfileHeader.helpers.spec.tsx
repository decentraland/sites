import { getFriendButtonConfig } from './ProfileHeader.helpers'
import type { FriendButtonConfig } from './ProfileHeader.helpers'

describe('when getting the friend button config', () => {
  let config: FriendButtonConfig

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and a friend request has been sent', () => {
    beforeEach(() => {
      config = getFriendButtonConfig('request_sent')
    })

    it('should offer the cancel action', () => {
      expect(config.action).toBe('cancel')
    })

    it('should use the request-sent label', () => {
      expect(config.labelKey).toBe('profile.header.request_sent')
    })

    it('should expose an icon', () => {
      expect(config.icon).toBeDefined()
    })
  })

  describe('and a friend request has been received', () => {
    beforeEach(() => {
      config = getFriendButtonConfig('request_received')
    })

    it('should offer the accept action', () => {
      expect(config.action).toBe('accept')
    })

    it('should use the add-friend label', () => {
      expect(config.labelKey).toBe('profile.header.add_friend')
    })
  })

  describe('and the friendship is accepted', () => {
    beforeEach(() => {
      config = getFriendButtonConfig('accepted')
    })

    it('should offer the remove action', () => {
      expect(config.action).toBe('remove')
    })

    it('should use the remove-friend label', () => {
      expect(config.labelKey).toBe('profile.header.remove_friend')
    })
  })

  describe('and there is no relationship yet', () => {
    beforeEach(() => {
      config = getFriendButtonConfig('none')
    })

    it('should default to the request action', () => {
      expect(config.action).toBe('request')
    })

    it('should use the add-friend label', () => {
      expect(config.labelKey).toBe('profile.header.add_friend')
    })
  })

  describe('and the user is blocked', () => {
    beforeEach(() => {
      config = getFriendButtonConfig('blocked')
    })

    it('should fall through to the request action', () => {
      expect(config.action).toBe('request')
    })

    it('should use the add-friend label', () => {
      expect(config.labelKey).toBe('profile.header.add_friend')
    })
  })

  describe('and the status is undefined', () => {
    beforeEach(() => {
      config = getFriendButtonConfig(undefined)
    })

    it('should fall through to the request action', () => {
      expect(config.action).toBe('request')
    })

    it('should use the add-friend label', () => {
      expect(config.labelKey).toBe('profile.header.add_friend')
    })
  })
})
