import { NotificationType, type SubscriptionDetails } from '@dcl/schemas'
import { SUBSCRIPTION_GROUP_ORDER, isGroupEnabled, setGroupEnabled, subscriptionGroups } from './account-notifications.helpers'
import { SubscriptionGroupKey } from './account-notifications.types'

const buildDetails = (override: Partial<Record<NotificationType, { email: boolean; in_app: boolean }>> = {}): SubscriptionDetails => {
  const messageType = {} as SubscriptionDetails['message_type']
  for (const type of Object.values(NotificationType)) {
    messageType[type] = { email: false, in_app: true }
  }
  for (const [type, channel] of Object.entries(override)) {
    messageType[type as NotificationType] = channel
  }
  return {
    ignore_all_email: true,
    ignore_all_in_app: false,
    message_type: messageType
  }
}

describe('account-notifications helpers', () => {
  describe('subscriptionGroups + order', () => {
    it('should expose every settings group in the display order', () => {
      expect(new Set(SUBSCRIPTION_GROUP_ORDER)).toEqual(new Set(Object.values(SubscriptionGroupKey)))
      expect(SUBSCRIPTION_GROUP_ORDER).toHaveLength(9)
    })

    it('should map referrals to the two referral notification types', () => {
      expect(subscriptionGroups[SubscriptionGroupKey.REFERRAL]).toEqual([
        NotificationType.REFERRAL_INVITED_USERS_ACCEPTED,
        NotificationType.REFERRAL_NEW_TIER_REACHED
      ])
    })
  })

  describe('isGroupEnabled', () => {
    it('should be false when no type in the group has email enabled', () => {
      expect(isGroupEnabled(buildDetails(), SubscriptionGroupKey.TIPS)).toBe(false)
    })

    it('should be true only when every type in the group has email enabled', () => {
      const details = buildDetails({ [NotificationType.TIP_RECEIVED]: { email: true, in_app: true } })
      expect(isGroupEnabled(details, SubscriptionGroupKey.TIPS)).toBe(true)
    })

    it('should be false for a partially-enabled group', () => {
      const details = buildDetails({ [NotificationType.EVENTS_STARTED]: { email: true, in_app: true } })
      // EVENTS_STARTS_SOON still disabled → partial → off.
      expect(isGroupEnabled(details, SubscriptionGroupKey.EVENTS)).toBe(false)
    })
  })

  describe('setGroupEnabled', () => {
    it('should enable email on every type in the group without mutating the input', () => {
      const details = buildDetails()
      const next = setGroupEnabled(details, SubscriptionGroupKey.EVENTS, true)

      expect(next).not.toBe(details)
      expect(next.message_type[NotificationType.EVENTS_STARTED].email).toBe(true)
      expect(next.message_type[NotificationType.EVENTS_STARTS_SOON].email).toBe(true)
      // Original untouched.
      expect(details.message_type[NotificationType.EVENTS_STARTED].email).toBe(false)
    })

    it('should leave the in_app channel untouched', () => {
      const next = setGroupEnabled(buildDetails(), SubscriptionGroupKey.TIPS, true)
      expect(next.message_type[NotificationType.TIP_RECEIVED].in_app).toBe(true)
    })

    it('should recompute ignore_all_email to false when at least one email is on', () => {
      const next = setGroupEnabled(buildDetails(), SubscriptionGroupKey.TIPS, true)
      expect(next.ignore_all_email).toBe(false)
    })

    it('should set ignore_all_email back to true when the last enabled group is turned off', () => {
      const enabled = setGroupEnabled(buildDetails(), SubscriptionGroupKey.TIPS, true)
      const disabled = setGroupEnabled(enabled, SubscriptionGroupKey.TIPS, false)
      expect(disabled.ignore_all_email).toBe(true)
    })
  })
})
