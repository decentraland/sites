import { useSearchParams } from 'react-router-dom'
import { mapEnvToDclenv } from '../config/dclenv'
import type { DeepLinkOptions } from '../features/places/places.types'

type DeepLinkQueryParams = Pick<DeepLinkOptions, 'dclenv' | 'sceneConsole' | 'multiInstance'>

/**
 * The deep-link query params every "open the explorer" surface forwards, read in
 * one place so a new param reaches all of them instead of only the launch site
 * it was added for: `?dclenv` (or `?env`, mapped), `?scene-console` and
 * `?multi-instance`.
 *
 * NOTE: `?multi-instance` is normalized to the literal `'true'` that ui2
 * documents. `launchDesktopApp` presence-checks the value rather than parsing
 * it, so forwarding `?multi-instance=false` verbatim would switch multi-instance
 * ON. `?scene-console` keeps its verbatim pass-through — it shipped before this
 * contract was written down and narrowing it here would be an unrelated
 * behavior change.
 *
 * Returns primitives rather than a memoized object so callers can list the
 * individual values in their `useCallback` deps.
 */
function useDeepLinkQueryParams(): DeepLinkQueryParams {
  const [searchParams] = useSearchParams()

  return {
    dclenv: searchParams.get('dclenv') ?? mapEnvToDclenv(searchParams.get('env')),
    sceneConsole: searchParams.get('scene-console') ?? undefined,
    multiInstance: searchParams.get('multi-instance') === 'true' ? 'true' : undefined
  }
}

export { useDeepLinkQueryParams }
