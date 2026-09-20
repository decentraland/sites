import { useEffect, useState } from 'react'
import type { LiveKitCredentials } from '../features/cast2/cast2.types'
import { generateRandomName } from '../features/cast2/cast2.utils'
import { fetchCastWatcherToken, fetchSceneAdapter } from '../features/discover/sceneAdapter'

interface UseSceneRoomArgs {
  location: string
  parcel?: string
  // For multi-scene worlds, the explicit entity hash to target. When absent
  // the gatekeeper resolves to the world's default scene.
  sceneId?: string
}

interface SceneRoomState {
  status: 'loading' | 'ready' | 'no-broadcast'
  mode: 'scene' | 'cast'
  credentials: LiveKitCredentials | null
}

// Owns scene-adapter credential fetching + retry. The page wraps the watcher
// layout in `<SceneRoomMount>` using these credentials so the LiveKit room
// div (which the LiveKit React SDK renders) can sit ABOVE the page grid,
// not inside it — otherwise it would break the grid-template-areas layout
// on `DiscoverScenePage`.
function useSceneRoom(args: UseSceneRoomArgs): SceneRoomState {
  const { location, parcel, sceneId } = args
  const [credentials, setCredentials] = useState<LiveKitCredentials | null>(null)
  const [mode, setMode] = useState<'scene' | 'cast'>('scene')
  const [status, setStatus] = useState<SceneRoomState['status']>('loading')

  useEffect(() => {
    if (!location) return
    let cancelled = false
    setStatus('loading')
    setCredentials(null)
    ;(async () => {
      const sceneCreds = await fetchSceneAdapter(
        location.endsWith('.eth') ? { worldName: location, parcel, sceneId } : { parcel: location }
      )
      if (cancelled) return
      if (sceneCreds) {
        setCredentials({ url: sceneCreds.url, token: sceneCreds.token, identity: 'guest', roomId: '' })
        setMode('scene')
        setStatus('ready')
        return
      }
      const identity = generateRandomName()
      const castCreds = await fetchCastWatcherToken({ location, identity, parcel })
      if (cancelled) return
      if (castCreds) {
        setCredentials({ url: castCreds.url, token: castCreds.token, identity, roomId: '' })
        setMode('cast')
        setStatus('ready')
      } else {
        setStatus('no-broadcast')
      }
    })()

    return () => {
      cancelled = true
    }
    // Deliberately independent of login state — see the identity invariant on
    // `fetchSceneAdapter`. Signing in or out must not re-open the room.
  }, [location, parcel, sceneId])

  return { status, mode, credentials }
}

export { useSceneRoom }
export type { SceneRoomState, UseSceneRoomArgs }
