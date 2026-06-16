import { NotificationType, type SubscriptionDetails } from '@dcl/schemas'
import { SubscriptionGroupKey, type SubscriptionGroups } from './account-notifications.types'

/**
 * Group → notification-type map ported from the standalone account dapp
 * (`src/modules/subscription/utils.ts`). Each settings row toggles the email channel of
 * every type in its group at once.
 */
const subscriptionGroups: SubscriptionGroups = {
  [SubscriptionGroupKey.MARKETPLACE]: [
    NotificationType.ITEM_SOLD,
    NotificationType.BID_ACCEPTED,
    NotificationType.BID_RECEIVED,
    NotificationType.ROYALTIES_EARNED,
    NotificationType.LAND_RENTAL_ENDED,
    NotificationType.LAND_RENTED
  ],
  [SubscriptionGroupKey.WORLDS]: [
    NotificationType.WORLDS_ACCESS_RESTORED,
    NotificationType.WORLDS_ACCESS_RESTRICTED,
    NotificationType.WORLDS_MISSING_RESOURCES,
    NotificationType.WORLDS_PERMISSION_GRANTED,
    NotificationType.WORLDS_PERMISSION_REVOKED
  ],
  [SubscriptionGroupKey.CREDITS]: [
    NotificationType.CREDITS_REMINDER_COMPLETE_GOALS,
    NotificationType.CREDITS_REMINDER_CLAIM_CREDITS,
    NotificationType.CREDITS_REMINDER_USAGE,
    NotificationType.CREDITS_REMINDER_DO_NOT_MISS_OUT
  ],
  [SubscriptionGroupKey.STREAMING]: [
    NotificationType.STREAMING_KEY_EXPIRED,
    NotificationType.STREAMING_KEY_RESET,
    NotificationType.STREAMING_KEY_REVOKE,
    NotificationType.STREAMING_PLACE_UPDATED,
    NotificationType.STREAMING_TIME_EXCEEDED
  ],
  [SubscriptionGroupKey.EVENTS]: [NotificationType.EVENTS_STARTED, NotificationType.EVENTS_STARTS_SOON],
  [SubscriptionGroupKey.REWARDS]: [
    NotificationType.REWARD_ASSIGNED,
    NotificationType.REWARD_CAMPAIGN_OUT_OF_FUNDS,
    NotificationType.REWARD_CAMPAIGN_OUT_OF_STOCK
  ],
  [SubscriptionGroupKey.DAO]: [
    NotificationType.GOVERNANCE_ANNOUNCEMENT,
    NotificationType.GOVERNANCE_AUTHORED_PROPOSAL_FINISHED,
    NotificationType.GOVERNANCE_COAUTHOR_REQUESTED,
    NotificationType.GOVERNANCE_NEW_COMMENT_ON_PROJECT_UPDATE,
    NotificationType.GOVERNANCE_NEW_COMMENT_ON_PROPOSAL,
    NotificationType.GOVERNANCE_PROPOSAL_ENACTED,
    NotificationType.GOVERNANCE_VOTING_ENDED_VOTER
  ],
  [SubscriptionGroupKey.TIPS]: [NotificationType.TIP_RECEIVED],
  [SubscriptionGroupKey.REFERRAL]: [NotificationType.REFERRAL_INVITED_USERS_ACCEPTED, NotificationType.REFERRAL_NEW_TIER_REACHED]
}

/**
 * Display order for the two-column grid (matches the Figma left-to-right, top-to-bottom flow):
 * Marketplace, Worlds, Marketplace Credits, In-World Streaming, Events, Giveaway and Rewards,
 * DAO, Tips, Referrals.
 */
const SUBSCRIPTION_GROUP_ORDER: SubscriptionGroupKey[] = [
  SubscriptionGroupKey.MARKETPLACE,
  SubscriptionGroupKey.WORLDS,
  SubscriptionGroupKey.CREDITS,
  SubscriptionGroupKey.STREAMING,
  SubscriptionGroupKey.EVENTS,
  SubscriptionGroupKey.REWARDS,
  SubscriptionGroupKey.DAO,
  SubscriptionGroupKey.TIPS,
  SubscriptionGroupKey.REFERRAL
]

/**
 * A group is considered "on" when EVERY type in it has its email channel enabled. A partially
 * enabled group (possible if the API toggled types individually) renders as off so flipping the
 * switch turns the whole group back on.
 */
function isGroupEnabled(details: SubscriptionDetails, group: SubscriptionGroupKey): boolean {
  const types = subscriptionGroups[group]
  return types.every(type => details.message_type[type]?.email === true)
}

/**
 * Returns a new `SubscriptionDetails` with every type in `group` set to `enabled` on the email
 * channel (in-app left untouched). `ignore_all_email` is recomputed: it becomes true only when no
 * type has an enabled email channel, matching the account dapp's behaviour.
 */
function setGroupEnabled(details: SubscriptionDetails, group: SubscriptionGroupKey, enabled: boolean): SubscriptionDetails {
  const messageType = { ...details.message_type }
  for (const type of subscriptionGroups[group]) {
    // snake_case keys are the notifications-workers wire contract (`@dcl/schemas` SubscriptionDetails).
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const current = messageType[type] ?? { email: false, in_app: true }
    messageType[type] = { ...current, email: enabled }
  }
  const ignoreAllEmail = Object.values(messageType).every(channel => !channel.email)
  /* eslint-disable @typescript-eslint/naming-convention */
  return {
    ...details,
    ignore_all_email: ignoreAllEmail,
    message_type: messageType
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}

export { SUBSCRIPTION_GROUP_ORDER, isGroupEnabled, setGroupEnabled, subscriptionGroups }
