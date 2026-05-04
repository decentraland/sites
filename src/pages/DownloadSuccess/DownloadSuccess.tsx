import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAnalytics, useTranslation } from '@dcl/hooks'
import { Logo, Typography } from 'decentraland-ui2'
import { LandingFooter } from '../../components/LandingFooter'
import { ANON_USER_ID_PARAM, useAnonUserId } from '../../hooks/useAnonUserId'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useGetIdentityId } from '../../hooks/useGetIdentityId'
import appleLogo from '../../images/apple-logo.svg'
import macOsLauncher from '../../images/download/macos_launcher.webp'
import macOsLaunchingDecentraland from '../../images/download/macos_launching_decentraland.webp'
import macOsRecentDownload from '../../images/download/macos_recent_download.webp'
import windowsDownloadsFolder from '../../images/download/windows_downloads_folder.webp'
import windowsLaunchingDecentraland from '../../images/download/windows_launching_decentraland.webp'
import windowsSetup from '../../images/download/windows_setup.webp'
import microsoftLogo from '../../images/microsoft-logo.svg'
import { acquireAutoDownloadLock, isAutoDownloadLocked, releaseAutoDownloadLock } from '../../modules/downloadSessionLock'
import { calculateDownloadUrl } from '../../modules/downloadWithIdentity'
import { DownloadPlace, SectionViewedTrack, SegmentEvent, resolveDownloadPlace } from '../../modules/segment'
import { streamOrFallback } from '../../modules/streamOrFallback'
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

const DownloadSuccess = memo(() => {
  const [searchParams] = useSearchParams()
  const { intl } = useTranslation()
  const { isInitialized, track } = useAnalytics()
  const getIdentityId = useGetIdentityId()
  const anonUserId = useAnonUserId()
  const { hasValidIdentity } = useAuthIdentity()
  // 'authenticated' = the visitor has an auth identity in localStorage at the
  // moment the download is triggered (i.e. they had previously logged in).
  // 'anonymous' = no identity, the campaign attribution chain relies entirely
  // on anon_user_id. Useful for breaking down the funnel by login state and
  // for catching regressions where authenticated users fall back to the
  // anonymous gateway path.
  const authState: 'authenticated' | 'anonymous' = hasValidIdentity ? 'authenticated' : 'anonymous'

  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [isFileSaved, setIsFileSaved] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)
  const downloadingRef = useRef(false)
  const footerAbortRef = useRef<AbortController | null>(null)
  const getIdentityIdRef = useRef(getIdentityId)
  const anonUserIdRef = useRef(anonUserId)
  const isInitializedRef = useRef(isInitialized)
  const trackRef = useRef(track)
  const authStateRef = useRef(authState)
  getIdentityIdRef.current = getIdentityId
  anonUserIdRef.current = anonUserId
  isInitializedRef.current = isInitialized
  trackRef.current = track
  authStateRef.current = authState

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
    const abortController = new AbortController()
    const { signal } = abortController
    const autoDownloadKey = `${clientOS}:${clientArch}`

    // Segment loads lazily via DeferredAnalyticsProvider, so on first paint
    // `isInitializedRef.current` is false and any track call would no-op.
    // The previous race-fix relied on `await calculateDownloadUrl(...)` taking
    // 100–500 ms (network call to /identities) as an implicit barrier — but
    // for the anonymous Download First flow `getIdentityId()` short-circuits
    // synchronously, so the await resolves in ~1 ms and we miss the events.
    // Poll until Segment is ready (or time out so we don't block forever).
    const waitForAnalytics = async (timeoutMs = 5000): Promise<void> => {
      const start = Date.now()
      while (!isInitializedRef.current && !signal.aborted && Date.now() - start < timeoutMs) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }

    const startDownload = async () => {
      if (isAutoDownloadLocked(autoDownloadKey)) {
        // A previous mount is still streaming from the gateway (or finished
        // within the rate-limit window). Showing the steps page without a new
        // gateway hit avoids tripping the per-IP rate limit on burst refresh.
        setIsFileSaved(true)
        return
      }

      setIsDownloading(true)
      setDownloadError(null)
      setIsFileSaved(false)
      setDownloadProgress(null)

      const { url, filename } = await calculateDownloadUrl({
        os: clientOS,
        arch: clientArch,
        fallbackLinks: FALLBACK_CDN_RELEASE_LINKS,
        getIdentityId: getIdentityIdRef.current,
        anonUserId: anonUserIdRef.current
      })

      if (signal.aborted) return

      acquireAutoDownloadLock(autoDownloadKey)
      const downloadUrl = addQueryParamsToUrlString(url, { [ANON_USER_ID_PARAM]: anonUserIdRef.current })

      try {
        // Stream the file via fetch so the loader stays visible until the
        // gateway has actually produced and started serving the installer.
        // The previous `<a>.click()`-only path returned synchronously and hid
        // the loader before the gateway responded — on Windows this leaves a
        // multi-second window where the user sees the steps page with no
        // download in flight. Fall back to the native anchor when fetch fails
        // (e.g. CORS not configured) so the download still happens.
        await streamOrFallback({
          url: downloadUrl,
          filename,
          signal,
          onProgress: setDownloadProgress
        })
      } finally {
        // Release the lock as soon as the gateway has finished serving (or
        // the fetch errored). A deliberate refresh after this point should
        // re-download the file.
        releaseAutoDownloadLock(autoDownloadKey)
      }

      if (signal.aborted) return
      setDownloadProgress(100)
      setIsFileSaved(true)

      // Now wait for Segment to be ready and fire both events. If it never
      // initializes within the timeout the events drop silently — same as
      // the pre-fix behavior, but at least we tried.
      await waitForAnalytics()
      if (signal.aborted || !isInitializedRef.current) return
      // eslint-disable-next-line @typescript-eslint/naming-convention
      trackRef.current(SegmentEvent.DOWNLOAD_STARTED, { place, href: osLink, auth_state: authStateRef.current })
      // eslint-disable-next-line @typescript-eslint/naming-convention
      trackRef.current(SegmentEvent.DOWNLOAD_SUCCESS, { place, href: url, filename, auth_state: authStateRef.current })
    }

    startDownload()
      .catch(async error => {
        if (signal.aborted) return
        console.error('Download error:', error)
        setDownloadError(error instanceof Error ? error.message : 'Download failed')
        await waitForAnalytics()
        if (signal.aborted || !isInitializedRef.current) return
        // eslint-disable-next-line @typescript-eslint/naming-convention
        trackRef.current(SegmentEvent.DOWNLOAD_FAILED, { place, href: osLink, auth_state: authStateRef.current })
      })
      .finally(() => {
        if (!signal.aborted) {
          setIsDownloading(false)
        }
      })

    return () => {
      abortController.abort()
    }
  }, [clientOS, clientArch, osLink, place])

  // Abort any in-flight footer-initiated stream when the page unmounts so we
  // don't leak the connection (and per-chunk setState calls) into a destroyed
  // component tree.
  useEffect(
    () => () => {
      footerAbortRef.current?.abort()
    },
    []
  )

  const handleDownloadClick = useCallback(
    async (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      if (downloadingRef.current) return
      const autoDownloadKey = `${clientOS}:${clientArch}`
      // Same rate-limit guard as the auto-download path: if a previous attempt
      // is still in the gateway's processing window, drop the click.
      if (isAutoDownloadLocked(autoDownloadKey)) return
      downloadingRef.current = true
      setIsDownloading(true)
      setDownloadProgress(null)

      footerAbortRef.current?.abort()
      const abortController = new AbortController()
      footerAbortRef.current = abortController
      acquireAutoDownloadLock(autoDownloadKey)

      const footerPlace = DownloadPlace.DOWNLOAD_SUCCESS_FOOTER
      // Re-download from the footer link is its own funnel event so analytics
      // can distinguish it from the auto-download that fires on page mount.
      if (isInitializedRef.current) {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        trackRef.current(SegmentEvent.DOWNLOAD_STARTED, { place: footerPlace, href: osLink, auth_state: authState })
      }

      try {
        const { url, filename } = await calculateDownloadUrl({
          os: clientOS,
          arch: clientArch,
          fallbackLinks: FALLBACK_CDN_RELEASE_LINKS,
          getIdentityId,
          anonUserId
        })
        const downloadUrl = addQueryParamsToUrlString(url, { [ANON_USER_ID_PARAM]: anonUserId })
        await streamOrFallback({
          url: downloadUrl,
          filename,
          signal: abortController.signal,
          onProgress: setDownloadProgress
        })
        if (abortController.signal.aborted) return
        setDownloadProgress(100)
        if (isInitializedRef.current) {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          trackRef.current(SegmentEvent.DOWNLOAD_SUCCESS, { place: footerPlace, href: url, filename, auth_state: authState })
        }
      } catch (error) {
        if (abortController.signal.aborted) return
        console.error('Download error:', error)
        setDownloadError(error instanceof Error ? error.message : 'Download failed')
        if (isInitializedRef.current) {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          trackRef.current(SegmentEvent.DOWNLOAD_FAILED, { place: footerPlace, href: osLink, auth_state: authState })
        }
      } finally {
        releaseAutoDownloadLock(autoDownloadKey)
        downloadingRef.current = false
        if (!abortController.signal.aborted) {
          setIsDownloading(false)
        }
      }
    },
    [clientOS, clientArch, anonUserId, getIdentityId, osLink, authState]
  )

  const showBackdrop = isDownloading || (!downloadError && !isFileSaved)

  const backdropContent = isDownloading ? (
    <DownloadBackdropContent>
      <Logo size="huge" />
      <DownloadDetailContainer>
        <DownloadBackdropText variant="h6">{l('page.download.downloading')}</DownloadBackdropText>
        <DownloadProgressContainer>
          <DownloadProgressBar variant={downloadProgress !== null ? 'determinate' : 'indeterminate'} value={downloadProgress ?? 0} />
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
