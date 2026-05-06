interface StreamerOnboardingProps {
  streamName?: string
  onJoin: (config: OnboardingConfig) => void
  isJoining: boolean
}

interface OnboardingConfig {
  displayName: string
  audioInputId: string
  audioOutputId: string
  videoDeviceId: string
}

export type { OnboardingConfig, StreamerOnboardingProps }
