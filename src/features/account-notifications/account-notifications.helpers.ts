import { NotificationType, type SubscriptionDetails } from '@dcl/schemas'
import { SubscriptionGroupKey, type SubscriptionGroups } from './account-notifications.types'

/**
 * Group → notification-type map ported from the standalone account dapp
 * (`src/modules/subscription/utils.ts`). Each accordion lists its group's types, and every
 * type exposes its own email toggle (the in-app channel stays on).
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
 * Display order for the two-column accordion grid (matches the Figma left-to-right, top-to-bottom
 * flow): Marketplace, Worlds, Marketplace Credits, In-World Streaming, Events, Giveaway and
 * Rewards, DAO, Tips, Referrals.
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

/** Reads a single notification type's email-channel state. */
function isTypeEmailEnabled(details: SubscriptionDetails, type: NotificationType): boolean {
  return details.message_type[type]?.email === true
}

/**
 * Returns a new `SubscriptionDetails` with `type`'s email channel set to `enabled` (in-app left
 * on, matching the account dapp). `ignore_all_email` is recomputed so it is true only when no type
 * has an enabled email channel.
 */
function setTypeEmail(details: SubscriptionDetails, type: NotificationType, enabled: boolean): SubscriptionDetails {
  const messageType = { ...details.message_type }
  // snake_case keys are the notifications-workers wire contract (`@dcl/schemas` SubscriptionDetails).
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const current = messageType[type] ?? { email: false, in_app: true }
  messageType[type] = { ...current, email: enabled }
  const ignoreAllEmail = Object.values(messageType).every(channel => !channel.email)
  /* eslint-disable @typescript-eslint/naming-convention */
  return { ...details, ignore_all_email: ignoreAllEmail, message_type: messageType }
  /* eslint-enable @typescript-eslint/naming-convention */
}

/** Master "Email Notification" toggle state — ON when emails are not globally muted. */
function isAllEmailEnabled(details: SubscriptionDetails): boolean {
  return !details.ignore_all_email
}

/**
 * Master toggle: flips the email channel of EVERY managed notification type to `enabled` and sets
 * `ignore_all_email` accordingly (mirrors the account dapp's top-level switch).
 */
function setAllEmail(details: SubscriptionDetails, enabled: boolean): SubscriptionDetails {
  const messageType = { ...details.message_type }
  for (const types of Object.values(subscriptionGroups)) {
    for (const type of types) {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const current = messageType[type] ?? { email: false, in_app: true }
      messageType[type] = { ...current, email: enabled }
    }
  }
  /* eslint-disable @typescript-eslint/naming-convention */
  return { ...details, ignore_all_email: !enabled, message_type: messageType }
  /* eslint-enable @typescript-eslint/naming-convention */
}

export { SUBSCRIPTION_GROUP_ORDER, isAllEmailEnabled, isTypeEmailEnabled, setAllEmail, setTypeEmail, subscriptionGroups }
