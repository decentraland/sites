import { NotificationType, type SubscriptionDetails } from '@dcl/schemas'
import {
  SUBSCRIPTION_GROUP_COLUMNS,
  SUBSCRIPTION_GROUP_ORDER,
  isAllEmailEnabled,
  isTypeEmailEnabled,
  setAllEmail,
  setTypeEmail,
  subscriptionGroups
} from './account-notifications.helpers'
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

    it('should split the groups into two independent columns covering every group once', () => {
      expect(SUBSCRIPTION_GROUP_COLUMNS).toHaveLength(2)
      const flattened = SUBSCRIPTION_GROUP_COLUMNS.flat()
      expect(flattened).toEqual(SUBSCRIPTION_GROUP_ORDER)
      expect(new Set(flattened)).toEqual(new Set(Object.values(SubscriptionGroupKey)))
    })

    it('should map referrals to the two referral notification types', () => {
      expect(subscriptionGroups[SubscriptionGroupKey.REFERRAL]).toEqual([
        NotificationType.REFERRAL_INVITED_USERS_ACCEPTED,
        NotificationType.REFERRAL_NEW_TIER_REACHED
      ])
    })
  })

  describe('isTypeEmailEnabled', () => {
    it('should be false when the type has its email channel off', () => {
      expect(isTypeEmailEnabled(buildDetails(), NotificationType.TIP_RECEIVED)).toBe(false)
    })

    it('should be true when the type has its email channel on', () => {
      const details = buildDetails({ [NotificationType.TIP_RECEIVED]: { email: true, in_app: true } })
      expect(isTypeEmailEnabled(details, NotificationType.TIP_RECEIVED)).toBe(true)
    })
  })

  describe('setTypeEmail', () => {
    it('should set a single type email channel without mutating the input or its in_app channel', () => {
      const details = buildDetails()
      const next = setTypeEmail(details, NotificationType.TIP_RECEIVED, true)

      expect(next).not.toBe(details)
      expect(next.message_type[NotificationType.TIP_RECEIVED].email).toBe(true)
      expect(next.message_type[NotificationType.TIP_RECEIVED].in_app).toBe(true)
      expect(details.message_type[NotificationType.TIP_RECEIVED].email).toBe(false)
    })

    it('should recompute ignore_all_email to false when at least one email is on', () => {
      expect(setTypeEmail(buildDetails(), NotificationType.TIP_RECEIVED, true).ignore_all_email).toBe(false)
    })

    it('should set ignore_all_email back to true when the last enabled type is turned off', () => {
      const enabled = setTypeEmail(buildDetails(), NotificationType.TIP_RECEIVED, true)
      expect(setTypeEmail(enabled, NotificationType.TIP_RECEIVED, false).ignore_all_email).toBe(true)
    })
  })

  describe('master toggle', () => {
    it('should reflect !ignore_all_email', () => {
      expect(isAllEmailEnabled(buildDetails())).toBe(false)
      expect(isAllEmailEnabled({ ...buildDetails(), ignore_all_email: false })).toBe(true)
    })

    it('should clear ignore_all_email when turned on without touching the per-type channels', () => {
      const details = buildDetails({ [NotificationType.ITEM_SOLD]: { email: true, in_app: true } })

      const next = setAllEmail(details, true)

      expect(next.ignore_all_email).toBe(false)
      // Individual switches keep their own state — the master only moves the global mute.
      expect(next.message_type).toEqual(details.message_type)
    })

    it('should set ignore_all_email when turned off without touching the per-type channels', () => {
      const details = buildDetails({ [NotificationType.ITEM_SOLD]: { email: true, in_app: true } })

      const next = setAllEmail(details, false)

      expect(next.ignore_all_email).toBe(true)
      expect(next.message_type[NotificationType.ITEM_SOLD].email).toBe(true)
      expect(next.message_type).toEqual(details.message_type)
    })
  })
})
