import { useMemo } from 'react'

type LiveNowQueryParams = { minUsers: number } | undefined

function useLiveNowQueryParams(): LiveNowQueryParams {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get('minUsers')
    if (raw !== null && !Number.isNaN(Number(raw))) {
      return { minUsers: Number(raw) }
    }
    return undefined
  }, [])
}

export { useLiveNowQueryParams }
export type { LiveNowQueryParams }
