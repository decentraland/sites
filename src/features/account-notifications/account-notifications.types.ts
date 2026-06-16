import type { NotificationType, Subscription, SubscriptionDetails } from '@dcl/schemas'

/**
 * Response of `GET /subscription`. The notifications-workers returns the canonical
 * `Subscription` plus a transient `unconfirmedEmail` while an address change is awaiting
 * its confirmation link. Mirrors `NotificationsAPI.getSubscription` in decentraland-dapps.
 */
type SubscriptionResponse = Subscription & {
  unconfirmedEmail?: string
}

/** Body of `PUT /set-email`. */
type SetEmailRequest = {
  email: string
}

/**
 * The settings UI groups the flat `NotificationType` → channel map into the nine
 * user-facing categories shown in the Figma. Keys are stable, locale-independent slugs
 * used to build i18n keys (`account.notifications.groups.<key>`).
 */
enum SubscriptionGroupKey {
  MARKETPLACE = 'marketplace',
  WORLDS = 'worlds',
  CREDITS = 'credits',
  STREAMING = 'streaming',
  EVENTS = 'events',
  REWARDS = 'rewards',
  DAO = 'dao',
  TIPS = 'tips',
  REFERRAL = 'referral'
}

/** Maps each settings group to the `NotificationType`s whose email channel it toggles. */
type SubscriptionGroups = Record<SubscriptionGroupKey, NotificationType[]>

export { SubscriptionGroupKey }
export type { SetEmailRequest, SubscriptionDetails, SubscriptionGroups, SubscriptionResponse }
