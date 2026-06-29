import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import appleLogo from '../images/apple-logo.svg'
import microsoftLogo from '../images/microsoft-logo.svg'
import { createDownloadTracker, toAuthState } from '../modules/downloadTracking'
import { triggerFileDownload } from '../modules/file'
import { DownloadPlace } from '../modules/segment'
import { addQueryParamsToUrlString, updateUrlWithLastValue } from '../modules/url'
import { OperativeSystem } from '../types/download.types'
import type { Architecture } from '../types/download.types'
import { ANON_USER_ID_PARAM, useAnonUserId } from './useAnonUserId'
import { useAuthIdentity } from './useAuthIdentity'
import { useDeferredTrack } from './useDeferredTrack'
import { Repo, useLatestGithubRelease } from './useLatestGithubRelease'

const REDIRECT_PATH = '/download/creator-hub-success'
const REDIRECT_DELAY_MS = 3000

type DownloadOption = {
  text: string
  image: string
  link?: string
  arch?: Architecture
}

const imageByOs: Record<string, string> = {
  [OperativeSystem.WINDOWS]: microsoftLogo,
  [OperativeSystem.MACOS]: appleLogo
}

function useCreatorHubDownload() {
  const track = useDeferredTrack()
  const anonUserId = useAnonUserId()
  const { hasValidIdentity } = useAuthIdentity()
  const [isLoadingUserAgentData, userAgentData] = useAdvancedUserAgentData()
  const { links, loading: isLoadingLinks } = useLatestGithubRelease(Repo.CREATOR_HUB)
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current !== null) {
        clearTimeout(redirectTimerRef.current)
      }
    }
  }, [])

  const isReady = !isLoadingLinks && !!links && !isLoadingUserAgentData

  const primaryOption: DownloadOption | null = useMemo(() => {
    if (!links || !userAgentData) return null

    if (userAgentData.os.name === OperativeSystem.MACOS) {
      return {
        text: OperativeSystem.MACOS,
        image: imageByOs[OperativeSystem.MACOS],
        link: links[OperativeSystem.MACOS]?.arm64 || links[OperativeSystem.MACOS]?.amd64,
        arch: userAgentData.cpu.architecture as Architecture
      }
    }

    if (links[userAgentData.os.name]) {
      return {
        text: userAgentData.os.name,
        image: imageByOs[userAgentData.os.name],
        link: links[userAgentData.os.name]?.[userAgentData.cpu.architecture],
        arch: userAgentData.cpu.architecture as Architecture
      }
    }

    return null
  }, [userAgentData, links])

  const secondaryOptions: DownloadOption[] = useMemo(() => {
    if (!links || !userAgentData) return []

    return Object.keys(links)
      .filter(os => os !== userAgentData.os.name)
      .map(os => {
        const osLinks = links[os]
        const firstArch = Object.keys(osLinks)[0]
        return {
          text: os,
          image: imageByOs[os],
          link: osLinks?.[firstArch],
          arch: firstArch as Architecture
        }
      })
  }, [userAgentData, links])

  const handleDownload = useCallback(
    (option: DownloadOption) => {
      if (!option.link) return

      if (redirectTimerRef.current !== null) {
        clearTimeout(redirectTimerRef.current)
        redirectTimerRef.current = null
      }

      const tracker = createDownloadTracker(track, {
        href: option.link,
        os: option.text as OperativeSystem,
        arch: option.arch ?? 'amd64',
        place: DownloadPlace.CREATOR_HUB_DOWNLOAD_PAGE,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        anon_user_id: anonUserId,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        auth_state: toAuthState(hasValidIdentity),
        // A download click is a one-shot intent; there is no per-attempt revisit
        // notion on this page. The funnel is joined to the success page via
        // anon_user_id, so revisit stays 0 to satisfy the shared schema.
        revisit: 0
      })
      tracker.started()
      triggerFileDownload(option.link)

      const redirectUrl = updateUrlWithLastValue(new URL(REDIRECT_PATH, window.location.origin).toString(), 'os', option.text)
      // Forward anon_user_id so the success page's download_success can be joined
      // to this download_started for the same visitor (useAnonUserId reads it
      // back from the URL on the next page).
      const finalUrl = addQueryParamsToUrlString(redirectUrl, { arch: option.arch, [ANON_USER_ID_PARAM]: anonUserId })
      redirectTimerRef.current = setTimeout(() => {
        window.location.href = finalUrl
      }, REDIRECT_DELAY_MS)
    },
    [track, anonUserId, hasValidIdentity]
  )

  return { isReady, primaryOption, secondaryOptions, handleDownload }
}

export { useCreatorHubDownload }
export type { DownloadOption }
