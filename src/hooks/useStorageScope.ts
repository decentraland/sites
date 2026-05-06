import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

interface StorageScope {
  realm: string | null
  position: string | null
}

function useStorageScope(): StorageScope {
  const [searchParams] = useSearchParams()
  const realm = searchParams.get('realm')
  const position = searchParams.get('position')
  return useMemo(() => ({ realm, position }), [realm, position])
}

export { useStorageScope }
export type { StorageScope }
