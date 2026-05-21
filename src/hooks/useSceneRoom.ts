import { useCallback, useEffect, useState } from 'react'
import type { AuthIdentity } from '@dcl/crypto'
import type { LiveKitCredentials } from '../features/cast2/cast2.types'
import { generateRandomName } from '../features/cast2/cast2.utils'
import { fetchCastWatcherToken, fetchSceneAdapter } from '../features/discover/sceneAdapter'

interface UseSceneRoomArgs {
  location: string
  parcel?: string
  // For multi-scene worlds, the explicit entity hash to target. When absent
  // the gatekeeper resolves to the world's default scene.
  sceneId?: string
  // Logged-in identity from useAuthIdentity. When present, the gatekeeper
  // request is signed as the real wallet so chat messages publish under the
  // user's address (profile + claimed name resolve). Absent → guest identity.
  identity?: AuthIdentity
}

interface SceneRoomState {
  status: 'loading' | 'ready' | 'no-broadcast'
  mode: 'scene' | 'cast'
  credentials: LiveKitCredentials | null
  retry: () => void
}

// Owns scene-adapter credential fetching + retry. The page wraps the watcher
// layout in `<SceneRoomMount>` using these credentials so the LiveKit room
// div (which the LiveKit React SDK renders) can sit ABOVE the page grid,
// not inside it — otherwise it would break the grid-template-areas layout
// on `DiscoverScenePage`.
function useSceneRoom({ location, parcel, sceneId, identity: userIdentity }: UseSceneRoomArgs): SceneRoomState {
  const [credentials, setCredentials] = useState<LiveKitCredentials | null>(null)
  const [mode, setMode] = useState<'scene' | 'cast'>('scene')
  const [status, setStatus] = useState<SceneRoomState['status']>('loading')
  // Bumping this triggers a re-fetch in the effect below; useCallback `retry`
  // is just a stable handle the UI can call without taking a dep on the bump.
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt(n => n + 1), [])

  useEffect(() => {
    if (!location) return
    let cancelled = false
    setStatus('loading')
    setCredentials(null)
    ;(async () => {
      const sceneCreds = await fetchSceneAdapter(
        location.endsWith('.eth')
          ? { worldName: location, parcel, sceneId, identity: userIdentity }
          : { parcel: location, identity: userIdentity }
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
    // Re-run when login state flips. `userIdentity` is memoized per-address by
    // useAuthIdentity, so this only fires on actual identity change — not on
    // every render.
  }, [location, parcel, sceneId, attempt, userIdentity])

  return { status, mode, credentials, retry }
}

export { useSceneRoom }
export type { SceneRoomState, UseSceneRoomArgs }
