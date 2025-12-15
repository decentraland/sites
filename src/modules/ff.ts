const FEATURE_FLAG = {
  conferencePage: 'landing-conference-page',
  unityWearablePreview: 'dapps-unity-wearable-preview',
  onboardingFlow: 'dapps-onboarding-flow'
} as const

enum OnboardingFlowVariant {
  V1 = 'V1',
  V2 = 'V2'
}

export { FEATURE_FLAG, OnboardingFlowVariant }
