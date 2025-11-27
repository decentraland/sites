import { useCallback } from 'react'

export function useGetIdentityId(): () => Promise<string | undefined> {
  return useCallback(async (): Promise<string | undefined> => {
    return undefined
  }, [])
}
