import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAnalytics, useTranslation } from '@dcl/hooks'
import { Logo, Typography } from 'decentraland-ui2'
import { LandingFooter } from '../../components/LandingFooter'
import { ANON_USER_ID_PARAM, useAnonUserId } from '../../hooks/useAnonUserId'
import { useGetIdentityId } from '../../hooks/useGetIdentityId'
import appleLogo from '../../images/apple-logo.svg'
import macOsLauncher from '../../images/download/macos_launcher.webp'
import macOsLaunchingDecentraland from '../../images/download/macos_launching_decentraland.webp'
import macOsRecentDownload from '../../images/download/macos_recent_download.webp'
import windowsDownloadsFolder from '../../images/download/windows_downloads_folder.webp'
import windowsLaunchingDecentraland from '../../images/download/windows_launching_decentraland.webp'
import windowsSetup from '../../images/download/windows_setup.webp'
import microsoftLogo from '../../images/microsoft-logo.svg'
import { calculateDownloadUrl, getDownloadLinkWithIdentity } from '../../modules/downloadWithIdentity'
import { triggerFileDownload } from '../../modules/file'
import { DownloadPlace, SectionViewedTrack, SegmentEvent, resolveDownloadPlace } from '../../modules/segment'
import { FALLBACK_CDN_RELEASE_LINKS, addQueryParamsToUrlString } from '../../modules/url'
import { Architecture, OperativeSystem } from '../../types/download.types'
import { DownloadSuccessLayout } from './DownloadSuccessLayout'
import type { DownloadSuccessStep, DownloadSuccessStepsWithOs } from './DownloadSuccess.types'
import {
  DownloadBackdropContent,
  DownloadBackdropText,
  DownloadDetailContainer,
  DownloadProgressBar,
  DownloadProgressContainer,
  HighlightAnimation
} from './DownloadSuccess.styled'

const VALID_ARCHS = new Set<string>(['amd64', 'arm64'])
const AUTO_DOWNLOAD_HISTORY_STATE_KEY = 'downloadSuccess:autoDownloadKey'
const AUTO_DOWNLOAD_SESSION_KEY = 'downloadSuccess:triggered'

const DownloadSuccess = memo(() => {
  const [searchParams] = useSearchParams()
  const { intl } = useTranslation()
  const { isInitialized, track } = useAnalytics()
  const getIdentityId = useGetIdentityId()
  const anonUserId = useAnonUserId()

  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [isFileSaved, setIsFileSaved] = useState(false)
  const downloadingRef = useRef(false)
  const getIdentityIdRef = useRef(getIdentityId)
  const anonUserIdRef = useRef(anonUserId)
  const isInitializedRef = useRef(isInitialized)
  const trackRef = useRef(track)
  getIdentityIdRef.current = getIdentityId
  anonUserIdRef.current = anonUserId
  isInitializedRef.current = isInitialized
  trackRef.current = track

  const rawOs = searchParams.get('os') || ''
  const osMap: Record<string, OperativeSystem> = {
    windows: OperativeSystem.WINDOWS,
    macos: OperativeSystem.MACOS
  }
  const clientOS = osMap[rawOs.toLowerCase()] ?? OperativeSystem.MACOS
  const defaultArch = clientOS === OperativeSystem.WINDOWS ? 'amd64' : 'arm64'
  const rawArch = searchParams.get('arch') || defaultArch
  const clientArch = (VALID_ARCHS.has(rawArch) ? rawArch : defaultArch) as Architecture
  const place = resolveDownloadPlace(searchParams.get('place'))

  const osIcon = clientOS === OperativeSystem.WINDOWS ? microsoftLogo : appleLogo
  const osLink =
    clientOS === OperativeSystem.WINDOWS ? FALLBACK_CDN_RELEASE_LINKS[clientOS]?.amd64 : FALLBACK_CDN_RELEASE_LINKS[clientOS]?.[clientArch]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const l = useCallback((id: string, values?: Record<string, any>) => intl.formatMessage({ id }, values), [intl])

  const productAction = l('page.download.success.subtitle_action_exploring') as string

  const steps: DownloadSuccessStepsWithOs = useMemo(() => {
    const spanTag = (chunks: React.ReactNode) => <span>{chunks}</span>

    return {
      [OperativeSystem.WINDOWS]: [
        {
          title: l('page.download.success.steps.windows.step1.title'),
          text: l('page.download.success.steps.windows.step1.text', { span: spanTag }),
          image: windowsDownloadsFolder
        },
        {
          title: l('page.download.success.steps.windows.step2.title'),
          text: l('page.download.success.steps.windows.step2.text', { span: spanTag }),
          image: windowsSetup
        },
        {
          title: l('page.download.success.steps.windows.step3.title'),
          text: l('page.download.success.steps.windows.step3.text', { span: spanTag }),
          image: windowsLaunchingDecentraland
        }
      ],
      [OperativeSystem.MACOS]: [
        {
          title: l('page.download.success.steps.macOS.step1.title'),
          text: l('page.download.success.steps.macOS.step1.text', { span: spanTag }),
          image: macOsRecentDownload
        },
        {
          title: l('page.download.success.steps.macOS.step2.title'),
          text: l('page.download.success.steps.macOS.step2.text', { span: spanTag }),
          image: macOsLauncher
        },
        {
          title: l('page.download.success.steps.macOS.step3.title'),
          text: l('page.download.success.steps.macOS.step3.text', { span: spanTag }),
          image: macOsLaunchingDecentraland
        }
      ]
    }
  }, [l])

  const currentSteps: DownloadSuccessStep[] = steps[clientOS] || steps[OperativeSystem.MACOS]

  useEffect(() => {
    let cancelled = false
    const autoDownloadKey = `${clientOS}:${clientArch}`

    const getHistoryState = (): Record<string, unknown> =>
      window.history.state && typeof window.history.state === 'object' ? (window.history.state as Record<string, unknown>) : {}

    const startDownload = async () => {
      const sessionKey = `${AUTO_DOWNLOAD_SESSION_KEY}:${autoDownloadKey}`
      if (sessionStorage.getItem(sessionKey)) {
        setIsFileSaved(true)
        return
      }

      const historyState = getHistoryState()

      if (historyState[AUTO_DOWNLOAD_HISTORY_STATE_KEY] === autoDownloadKey) {
        setIsFileSaved(true)
        return
      }

      setIsDownloading(true)
      setDownloadError(null)
      setIsFileSaved(false)

      // NOTE: download_started is fired AFTER calculateDownloadUrl (not before)
      // because Segment loads lazily via DeferredAnalyticsProvider — at page
      // mount `isInitialized` is still false and the track call would no-op.
      // The await gives Segment ~50–300 ms to finish loading, so by the time
      // we get here `isInitializedRef.current` is true and both started/success
      // events go through.
      const { url, filename } = await calculateDownloadUrl({
        os: clientOS,
        arch: clientArch,
        fallbackLinks: FALLBACK_CDN_RELEASE_LINKS,
        getIdentityId: getIdentityIdRef.current
      })

      if (cancelled) return

      const latestHistoryState = getHistoryState()
      if (latestHistoryState[AUTO_DOWNLOAD_HISTORY_STATE_KEY] !== autoDownloadKey) {
        window.history.replaceState(
          {
            ...latestHistoryState,
            [AUTO_DOWNLOAD_HISTORY_STATE_KEY]: autoDownloadKey
          },
          '',
          window.location.href
        )
      }

      if (cancelled) return

      if (isInitializedRef.current) {
        trackRef.current(SegmentEvent.DOWNLOAD_STARTED, { place, href: osLink })
      }

      sessionStorage.setItem(sessionKey, '1')
      const downloadUrl = addQueryParamsToUrlString(url, { [ANON_USER_ID_PARAM]: anonUserIdRef.current })
      triggerFileDownload(downloadUrl)
      setIsFileSaved(true)

      if (isInitializedRef.current) {
        trackRef.current(SegmentEvent.DOWNLOAD_SUCCESS, { place, href: url, filename })
      }
    }

    startDownload()
      .catch(error => {
        if (cancelled) return
        console.error('Download error:', error)
        setDownloadError(error instanceof Error ? error.message : 'Download failed')
        if (isInitializedRef.current) {
          trackRef.current(SegmentEvent.DOWNLOAD_FAILED, { place, href: osLink })
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsDownloading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [clientOS, clientArch, osLink, place])

  const handleDownloadClick = useCallback(
    async (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      if (downloadingRef.current) return
      downloadingRef.current = true
      setIsDownloading(true)

      const footerPlace = DownloadPlace.DOWNLOAD_SUCCESS_FOOTER
      // Re-download from the footer link is its own funnel event so analytics
      // can distinguish it from the auto-download that fires on page mount.
      if (isInitializedRef.current) {
        trackRef.current(SegmentEvent.DOWNLOAD_STARTED, { place: footerPlace, href: osLink })
      }

      try {
        const url = await getDownloadLinkWithIdentity({
          os: clientOS,
          arch: clientArch,
          fallbackLinks: FALLBACK_CDN_RELEASE_LINKS,
          queryParams: { [ANON_USER_ID_PARAM]: anonUserId },
          getIdentityId
        })
        if (isInitializedRef.current) {
          trackRef.current(SegmentEvent.DOWNLOAD_SUCCESS, { place: footerPlace, href: url ?? osLink })
        }
      } catch (error) {
        console.error('Download error:', error)
        setDownloadError(error instanceof Error ? error.message : 'Download failed')
        if (isInitializedRef.current) {
          trackRef.current(SegmentEvent.DOWNLOAD_FAILED, { place: footerPlace, href: osLink })
        }
      } finally {
        downloadingRef.current = false
        setIsDownloading(false)
      }
    },
    [clientOS, clientArch, anonUserId, getIdentityId, osLink]
  )

  const showBackdrop = isDownloading || (!downloadError && !isFileSaved)

  const backdropContent = isDownloading ? (
    <DownloadBackdropContent>
      <Logo size="huge" />
      <DownloadDetailContainer>
        <DownloadBackdropText variant="h6">{l('page.download.downloading')}</DownloadBackdropText>
        <DownloadProgressContainer>
          <DownloadProgressBar />
        </DownloadProgressContainer>
      </DownloadDetailContainer>
    </DownloadBackdropContent>
  ) : undefined

  return (
    <DownloadSuccessLayout
      loading={showBackdrop}
      backdropContent={backdropContent}
      osIcon={osIcon}
      title={l('page.download.success.title')}
      subtitle={l('page.download.success.subtitle', { action: productAction })}
      steps={currentSteps}
      renderCardOverlay={(_step, index) => (index === 0 && productAction === 'exploring' ? <HighlightAnimation /> : null)}
      footer={
        <Typography variant="body1">
          {l('page.download.success.footer', {
            link: (
              <a href={osLink} onClick={handleDownloadClick} data-event={SectionViewedTrack.DOWNLOAD}>
                {l('page.download.success.footer_link_label')}
              </a>
            )
          })}
        </Typography>
      }
      afterContent={<LandingFooter />}
    />
  )
})

DownloadSuccess.displayName = 'DownloadSuccess'

export { DownloadSuccess }
