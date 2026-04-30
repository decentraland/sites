type CheckpointParams = {
  checkpointId: 1
  action?: 'reached' | 'completed'
  anonUserId?: string
  metadata?: Record<string, unknown>
}

/**
 * Sends a CP1 (`downloaded`) checkpoint to Segment. The anonymous id ties the
 * row to CP2/CP3 later: landing and auth share the `decentraland.org` Segment
 * cookie, and the launcher propagates the same id to Explorer.
 *
 * Skips the call if no `anonUserId` is available — the auth-server can't link
 * the row to the rest of the funnel without it.
 */
export function trackCheckpoint(track: (event: string, data?: Record<string, unknown>) => void, params: CheckpointParams): void {
  if (!params.anonUserId) return

  track('Onboarding Checkpoint', {
    checkpointId: params.checkpointId,
    action: params.action ?? 'reached',
    userIdentifier: params.anonUserId,
    identifierType: 'anon',
    source: 'landing',
    metadata: params.metadata
  })
}
