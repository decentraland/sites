import { useMemo } from 'react'
import { getEnv } from '../config/env'

const useReferralUrl = (referrer?: string, directDownload = false) => {
  return useMemo(() => {
    const downloadUrl = getEnv('DOWNLOAD_URL') || '/download'

    if (directDownload) {
      // Direct download flow: the referrer travels with the download URL and is
      // consumed by the installer attribution chain (gateway → launcher → explorer)
      const url = new URL(downloadUrl, window.location.origin)
      if (referrer) {
        url.searchParams.set('referrer', referrer)
      }
      return url.toString()
    }

    const authUrl = getEnv('AUTH_URL') || '/auth'
    const tempUrl = new URL(authUrl, window.location.origin)
    tempUrl.pathname = '/auth/login'
    if (referrer) {
      tempUrl.searchParams.set('referrer', referrer)
    }
    tempUrl.searchParams.set('redirectTo', downloadUrl)
    return tempUrl.toString()
  }, [referrer, directDownload])
}

export { useReferralUrl }
