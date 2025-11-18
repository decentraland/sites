const FeatureFlag = {
  ConferencePage: 'landing-conference-page',
  UnityWearablePreview: 'dapps-unity-wearable-preview',
  OnboardingFlow: 'dapps-onboarding-flow'
} as const

enum OnboardingFlowVariant {
  V1 = 'V1',
  V2 = 'V2'
}

export { FeatureFlag, OnboardingFlowVariant }
