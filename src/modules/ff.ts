const FEATURE_FLAG = {
  conferencePage: 'landing-conference-page',
  unityWearablePreview: 'dapps-unity-wearable-preview',
  onboardingFlow: 'dapps-onboarding-flow',
  inviteDirectDownload: 'dapps-invite-direct-download',
  eventFeaturedItemSearch: 'dapps-event-featured-item-search',
  placesRepeatCrossSections: 'dapps-places-repeat-cross-sections',
  // Kill switch for the Segment first-party proxy, shared across our dapps. ON means send
  // analytics straight to Segment; see `segmentKillSwitch.ts` for why it is read from
  // localStorage at boot instead of from this store.
  segmentKillSwitch: 'dapps-seg-alt'
} as const

enum OnboardingFlowVariant {
  V1 = 'V1',
  V2 = 'V2'
}

export { FEATURE_FLAG, OnboardingFlowVariant }
