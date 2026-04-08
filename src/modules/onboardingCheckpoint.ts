type CheckpointParams = {
  checkpointId: number
  action?: 'reached' | 'completed'
  userIdentifier?: string
  identifierType?: 'email' | 'wallet'
  email?: string
  wallet?: string
  source?: string
  metadata?: Record<string, unknown>
}

export function trackCheckpoint(track: (event: string, data?: Record<string, unknown>) => void, params: CheckpointParams): void {
  // Don't send checkpoints without an identifier — they cause 400s on the backend
  // and we can't send nudge emails without knowing who the user is
  if (!params.userIdentifier || !params.identifierType) return

  track('Onboarding Checkpoint', {
    checkpointId: params.checkpointId,
    action: params.action ?? 'reached',
    userIdentifier: params.userIdentifier,
    identifierType: params.identifierType,
    email: params.email,
    wallet: params.wallet,
    source: params.source ?? 'landing',
    metadata: params.metadata
  })
}
