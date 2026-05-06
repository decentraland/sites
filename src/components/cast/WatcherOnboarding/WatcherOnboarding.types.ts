interface WatcherOnboardingProps {
  streamName?: string
  onJoin: (config: WatcherOnboardingConfig) => void
  isJoining: boolean
}

interface WatcherOnboardingConfig {
  audioOutputId: string
}

export type { WatcherOnboardingConfig, WatcherOnboardingProps }
