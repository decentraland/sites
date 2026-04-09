const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const WALLET_RE = /^0x[0-9a-f]{40}$/i

type CheckpointParams = {
  checkpointId: number
  action?: 'reached' | 'completed'
  email?: string
  wallet?: string
  metadata?: Record<string, unknown>
}

function resolveIdentifier(email?: string, wallet?: string) {
  if (email && EMAIL_RE.test(email)) return { userIdentifier: email, identifierType: 'email' as const }
  if (wallet && WALLET_RE.test(wallet)) return { userIdentifier: wallet, identifierType: 'wallet' as const }
  return { userIdentifier: undefined, identifierType: undefined }
}

export function trackCheckpoint(track: (event: string, data?: Record<string, unknown>) => void, params: CheckpointParams): void {
  const { userIdentifier, identifierType } = resolveIdentifier(params.email, params.wallet)

  // Don't send checkpoints without an identifier — they cause 400s on the backend
  // and we can't send nudge emails without knowing who the user is
  if (!userIdentifier || !identifierType) return

  track('Onboarding Checkpoint', {
    checkpointId: params.checkpointId,
    action: params.action ?? 'reached',
    userIdentifier,
    identifierType,
    email: params.email,
    source: 'landing',
    metadata: params.metadata
  })
}
