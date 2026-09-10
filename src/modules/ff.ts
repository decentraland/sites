const FEATURE_FLAG = {
  conferencePage: 'landing-conference-page',
  unityWearablePreview: 'dapps-unity-wearable-preview',
  onboardingFlow: 'dapps-onboarding-flow',
  inviteDirectDownload: 'dapps-invite-direct-download',
  eventFeaturedItemSearch: 'dapps-event-featured-item-search',
  placesRepeatCrossSections: 'dapps-places-repeat-cross-sections',
  placesHideFeaturedSection: 'dapps-places-hide-featured-section',
  placesLiveMinUsers: 'dapps-places-live-min-user'
} as const

enum OnboardingFlowVariant {
  V1 = 'V1',
  V2 = 'V2'
}

export { FEATURE_FLAG, OnboardingFlowVariant }
