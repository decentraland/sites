import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import appleLogo from '../images/apple-logo.svg'
import microsoftLogo from '../images/microsoft-logo.svg'
import { triggerFileDownload } from '../modules/file'
import { addQueryParamsToUrlString, updateUrlWithLastValue } from '../modules/url'
import { OperativeSystem } from '../types/download.types'
import type { Architecture } from '../types/download.types'
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

  const handleDownload = useCallback((option: DownloadOption) => {
    if (!option.link) return

    triggerFileDownload(option.link)

    const redirectUrl = updateUrlWithLastValue(new URL(REDIRECT_PATH, window.location.origin).toString(), 'os', option.text)
    const finalUrl = addQueryParamsToUrlString(redirectUrl, { arch: option.arch })
    redirectTimerRef.current = setTimeout(() => {
      window.location.href = finalUrl
    }, REDIRECT_DELAY_MS)
  }, [])

  return { isReady, primaryOption, secondaryOptions, handleDownload }
}

export { useCreatorHubDownload }
export type { DownloadOption }
