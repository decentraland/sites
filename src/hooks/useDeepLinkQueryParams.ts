import { useSearchParams } from 'react-router-dom'
import { mapEnvToDclenv, normalizeDclenv } from '../config/dclenv'
import type { DeepLinkOptions } from '../features/places/places.types'

type DeepLinkQueryParams = Pick<DeepLinkOptions, 'dclenv' | 'sceneConsole' | 'multiInstance'>

/**
 * The deep-link query params every "open the explorer" surface forwards, read in
 * one place so a new param reaches all of them instead of only the launch site
 * it was added for: `?dclenv` (or `?env`, mapped), `?scene-console` and
 * `?multi-instance`.
 *
 * NOTE: every value is validated here rather than forwarded verbatim, because
 * `launchDesktopApp` presence-checks its options without parsing them. So
 * `?multi-instance=false` would otherwise switch multi-instance ON, and an
 * arbitrary `?dclenv` would redirect which Explorer environment opens. Both
 * flags are narrowed to the literal `'true'` that ui2 documents, and `?dclenv`
 * is matched against the known environments (see `normalizeDclenv`).
 *
 * The returned object is not memoized; its fields are primitives, so callers
 * destructure and list the individual values in their `useCallback` deps.
 */
function useDeepLinkQueryParams(): DeepLinkQueryParams {
  const [searchParams] = useSearchParams()

  return {
    dclenv: normalizeDclenv(searchParams.get('dclenv')) ?? mapEnvToDclenv(searchParams.get('env')),
    sceneConsole: searchParams.get('scene-console') === 'true' ? 'true' : undefined,
    multiInstance: searchParams.get('multi-instance') === 'true' ? 'true' : undefined
  }
}

export { useDeepLinkQueryParams }
