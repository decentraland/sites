const FEATURE_FLAG = {
  conferencePage: 'landing-conference-page',
  unityWearablePreview: 'dapps-unity-wearable-preview',
  onboardingFlow: 'dapps-onboarding-flow',
  inviteDirectDownload: 'dapps-invite-direct-download',
  eventFeaturedItemSearch: 'dapps-event-featured-item-search',
  placesRepeatCrossSections: 'dapps-places-repeat-cross-sections',
  // Kill switch for the Segment first-party proxy. ON means send analytics straight to Segment.
  // The name is deliberately short and shared: sibling dapps switch their own proxy off with the
  // same flag. See `segmentKillSwitch.ts` for why it is read from localStorage at boot rather
  // than through this store.
  segmentKillSwitch: 'dapps-seg-alt'
} as const

enum OnboardingFlowVariant {
  V1 = 'V1',
  V2 = 'V2'
}

export { FEATURE_FLAG, OnboardingFlowVariant }
