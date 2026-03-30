import { useMemo } from 'react'
import { getEnv } from '../config/env'

const useReferralUrl = (referrer?: string) => {
  return useMemo(() => {
    const authUrl = getEnv('AUTH_URL') || '/auth'
    const downloadUrl = getEnv('DOWNLOAD_URL') || '/download'
    const tempUrl = new URL(authUrl, window.location.origin)
    tempUrl.pathname = '/auth/login'
    if (referrer) {
      tempUrl.searchParams.set('referrer', referrer)
    }
    tempUrl.searchParams.set('redirectTo', downloadUrl)
    return tempUrl.toString()
  }, [referrer])
}

export { useReferralUrl }
