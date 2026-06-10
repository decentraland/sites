import { useOutletContext } from 'react-router-dom'
import type { WorldDeployment } from '../../../features/creators'
import type { DiscoverPlace } from '../../../features/discover'

// Provided by CreatorWorldLayout, consumed by every /creators/world/:name/*
// sub-page. The layout fetches the world's deployments + places-api metadata
// once and hands them down so each tab doesn't re-derive them.
interface WorldOutletContext {
  worldName: string
  deployments: WorldDeployment[]
  // Newest deployment (deployments[0]) or null when the world has none.
  latest: WorldDeployment | null
  // places-api metadata (thumbnail, description, live user count) — may be null
  // for private / unindexed worlds.
  place: DiscoverPlace | null
}

function useWorldContext(): WorldOutletContext {
  return useOutletContext<WorldOutletContext>()
}

export { useWorldContext }
export type { WorldOutletContext }
