import type { ActiveEntity } from '../features/events/events.types'

const DEFAULT_BATCH_TIMEOUT_MS = 5_000

interface DeploymentEntry {
  entityId: string
  deployedBy: string
}

interface DeploymentResponse {
  deployments: DeploymentEntry[]
}

interface ResolveDeployersOptions {
  timeoutMs?: number
}

// Batches the deployer lookup for a list of parcel coordinates so the call
// site avoids the N+1 of one `entities/active` + one `deployments` request
// per coordinate. Returns a Map keyed by the input coordinate string ("x,y").
function buildTimeoutSignal(timeoutMs: number): AbortSignal | undefined {
  if (typeof AbortSignal === 'undefined' || typeof AbortSignal.timeout !== 'function') return undefined
  return AbortSignal.timeout(timeoutMs)
}

async function resolveDeployers(
  peerUrl: string,
  coordinates: string[],
  options: ResolveDeployersOptions = {}
): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  if (coordinates.length === 0) return result

  const signal = buildTimeoutSignal(options.timeoutMs ?? DEFAULT_BATCH_TIMEOUT_MS)
  const coordinatesSet = new Set(coordinates)

  const entities = await fetch(`${peerUrl}/content/entities/active`, {
    method: 'POST',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pointers: coordinates }),
    signal
  })
    .then(res => {
      if (!res.ok) {
        console.warn('[peer] active entities batch failed', res.status)
        return [] as ActiveEntity[]
      }
      return res.json() as Promise<ActiveEntity[]>
    })
    .catch((err: unknown) => {
      console.warn('[peer] active entities batch failed', err)
      return [] as ActiveEntity[]
    })

  if (entities.length === 0) return result

  const params = new URLSearchParams()
  for (const entity of entities) params.append('entityId', entity.id)

  const deploymentData = await fetch(`${peerUrl}/content/deployments/?${params}`, { signal })
    .then(res => {
      if (!res.ok) {
        console.warn('[peer] deployments batch failed', res.status)
        return null
      }
      return res.json() as Promise<DeploymentResponse>
    })
    .catch((err: unknown) => {
      console.warn('[peer] deployments batch failed', err)
      return null
    })

  if (!deploymentData) return result

  const deployerByEntityId = new Map<string, string>()
  for (const deployment of deploymentData.deployments) {
    if (deployment.deployedBy && deployment.entityId) {
      deployerByEntityId.set(deployment.entityId, deployment.deployedBy)
    }
  }

  for (const entity of entities) {
    const deployedBy = deployerByEntityId.get(entity.id)
    if (!deployedBy) continue
    for (const pointer of entity.pointers) {
      if (coordinatesSet.has(pointer)) {
        result.set(pointer, deployedBy)
      }
    }
  }

  return result
}

export { resolveDeployers }
export type { ResolveDeployersOptions }
