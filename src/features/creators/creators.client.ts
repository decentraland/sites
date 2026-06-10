import { placesClient } from '../../services/placesClient'
import { getWorldsContentServerUrl, resolveThumbnailUrl, sdkVersionLabel } from './creators.helpers'
import type { WorldDeployment, WorldSceneRaw, WorldScenesRawResponse } from './creators.types'

// Derive a deployment from a single scene entity.
function toDeployment(scene: WorldSceneRaw): WorldDeployment | null {
  if (!scene.entityId) return null
  const metadata = scene.entity?.metadata
  const content = scene.entity?.content
  return {
    entityId: scene.entityId,
    deployer: scene.deployer,
    title: metadata?.display?.title || scene.entityId.slice(0, 10),
    description: metadata?.display?.description,
    baseParcel: metadata?.scene?.base,
    parcelCount: metadata?.scene?.parcels?.length ?? 0,
    contentFileCount: content?.length ?? 0,
    thumbnailUrl: resolveThumbnailUrl(metadata?.display?.navmapThumbnail, content),
    sdkVersion: sdkVersionLabel(metadata?.runtimeVersion),
    requiredPermissions: metadata?.requiredPermissions ?? [],
    authoritativeMultiplayer: metadata?.authoritativeMultiplayer === true,
    deployedAt: scene.entity?.timestamp
  }
}

// Map the raw scenes response into deployments, newest first.
function toDeployments(response: WorldScenesRawResponse | undefined): WorldDeployment[] {
  return (response?.scenes ?? [])
    .map(toDeployment)
    .filter((deployment): deployment is WorldDeployment => deployment !== null)
    .sort((a, b) => (b.deployedAt ?? 0) - (a.deployedAt ?? 0))
}

const creatorsEndpoints = placesClient.injectEndpoints({
  endpoints: build => ({
    // Active deployment(s) for a world from worlds-content-server
    // `/world/{name}/scenes`. There is no deploy-history endpoint upstream, so
    // this returns the current active deployment per scene (one for most
    // worlds, several for multi-scene worlds).
    getWorldDeployments: build.query<WorldDeployment[], { worldName: string }>({
      queryFn: async ({ worldName }) => {
        const name = worldName.toLowerCase()
        const url = `${getWorldsContentServerUrl()}/world/${encodeURIComponent(name)}/scenes`
        try {
          const response = await fetch(url)
          if (!response.ok) {
            return { error: { status: response.status, data: await response.text().catch(() => undefined) } }
          }
          const json: WorldScenesRawResponse = await response.json()
          return { data: toDeployments(json) }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR' as const, error: error instanceof Error ? error.message : String(error) } }
        }
      },
      providesTags: (_result, _error, { worldName }) => [{ type: 'WorldOverview' as const, id: worldName.toLowerCase() }]
    })
  })
})

const { useGetWorldDeploymentsQuery } = creatorsEndpoints

export { creatorsEndpoints, toDeployment, toDeployments, useGetWorldDeploymentsQuery }
