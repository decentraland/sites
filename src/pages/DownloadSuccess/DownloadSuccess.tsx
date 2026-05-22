import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from '@dcl/hooks'
import { Logo, Typography } from 'decentraland-ui2'
import { LandingFooter } from '../../components/LandingFooter'
import { ANON_USER_ID_PARAM, useAnonUserId } from '../../hooks/useAnonUserId'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useDeferredTrack } from '../../hooks/useDeferredTrack'
import { useGetIdentityId } from '../../hooks/useGetIdentityId'
import appleLogo from '../../images/apple-logo.svg'
import macOsLauncher from '../../images/download/macos_launcher.webp'
import macOsLaunchingDecentraland from '../../images/download/macos_launching_decentraland.webp'
import macOsRecentDownload from '../../images/download/macos_recent_download.webp'
import windowsDownloadsFolder from '../../images/download/windows_downloads_folder.webp'
import windowsLaunchingDecentraland from '../../images/download/windows_launching_decentraland.webp'
import windowsSetup from '../../images/download/windows_setup.webp'
import microsoftLogo from '../../images/microsoft-logo.svg'
import { createDownloadTracker } from '../../modules/downloadTracking'
import type { DownloadTracker } from '../../modules/downloadTracking.types'
import { calculateDownloadUrl } from '../../modules/downloadWithIdentity'
import { DownloadPlace, SegmentEvent, resolveDownloadPlace } from '../../modules/segment'
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
  const deferredTrack = useDeferredTrack()
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
  const authStateRef = useRef(authState)
  getIdentityIdRef.current = getIdentityId
  anonUserIdRef.current = anonUserId
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

  // Revisit counter — captured once at mount via a lazy useState initializer
  // so re-renders don't double-increment. Keyed by os:arch so that switching
  // platforms resets the counter for that combo. `revisit: 0` is a first
  // visit; `revisit: n` is the n-th revisit (refresh / back-forward / etc.).
  const [revisitNumber] = useState(() => {
    const visitsKey = `downloadSuccess:visits:${clientOS}:${clientArch}`
    const current = Number(sessionStorage.getItem(visitsKey) ?? '0')
    sessionStorage.setItem(visitsKey, String(current + 1))
    return current
  })

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

    const startDownload = async () => {
      setIsDownloading(true)
      setDownloadError(null)
      setIsFileSaved(false)
      setDownloadProgress(null)

      // Tracker is built only after URL resolution succeeds, so href on
      // _STARTED / _SUCCESS always points at the downloadUrl we actually
      // requested. If URL resolution itself rejects, the catch below builds
      // a fallback tracker with osLink so _FAILED still goes out with the
      // best context we have at that point.
      let tracker: DownloadTracker | null = null

      try {
        const { url, filename } = await calculateDownloadUrl({
          os: clientOS,
          arch: clientArch,
          fallbackLinks: FALLBACK_CDN_RELEASE_LINKS,
          getIdentityId: getIdentityIdRef.current,
          anonUserId: anonUserIdRef.current
        })

        if (signal.aborted) return

        const downloadUrl = addQueryParamsToUrlString(url, { [ANON_USER_ID_PARAM]: anonUserIdRef.current })

        tracker = createDownloadTracker(deferredTrack, {
          place,
          href: downloadUrl,
          os: clientOS,
          arch: clientArch,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          anon_user_id: anonUserIdRef.current ?? undefined,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          auth_state: authStateRef.current,
          revisit: revisitNumber
        })

        // Fire intent BEFORE the stream so a mid-stream tab close still
        // leaves a `_STARTED` in the warehouse — paired with no `_SUCCESS`
        // it means "user intended to download but didn't complete".
        tracker.started()

        // Stream the file via fetch on Windows so the "Downloading..." backdrop
        // stays in sync with the actual transfer (the gateway's per-request
        // NSIS+sign step can run 5-30s and the synchronous `<a>.click()` would
        // hide the backdrop the instant the click is queued, leaving the user
        // staring at the steps page while the gateway is still working).
        // macOS goes through the native anchor to preserve the
        // kMDItemWhereFroms xattr the launcher reads for attribution.
        const result = await streamOrFallback({
          url: downloadUrl,
          filename,
          os: clientOS,
          signal,
          onProgress: setDownloadProgress
        })

        if (signal.aborted) return
        setDownloadProgress(100)
        setIsFileSaved(true)
        tracker.success(filename, result.bytesTransferred)
      } catch (error) {
        if (signal.aborted) return
        console.error('Download error:', error)
        const reason = error instanceof Error ? error.message : 'Download failed'
        setDownloadError(reason)

        if (tracker) {
          tracker.failed(reason)
        } else {
          // URL resolution rejected — no downloadUrl in hand. Emit `_FAILED`
          // with osLink as the best-known href so analytics still records the
          // attempt with consistent shape.
          const fallbackTracker = createDownloadTracker(deferredTrack, {
            place,
            href: osLink,
            os: clientOS,
            arch: clientArch,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            anon_user_id: anonUserIdRef.current ?? undefined,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            auth_state: authStateRef.current,
            revisit: revisitNumber
          })
          fallbackTracker.failed(reason)
        }
      } finally {
        if (!signal.aborted) {
          setIsDownloading(false)
        }
      }
    }

    void startDownload()

    return () => {
      abortController.abort()
    }
  }, [clientOS, clientArch, osLink, place, revisitNumber, deferredTrack])

  const handleDownloadClick = useCallback(
    async (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      if (downloadingRef.current) return
      downloadingRef.current = true
      setIsDownloading(true)
      setDownloadProgress(null)

      // Footer re-download has its own AbortController so unmounts and
      // page navigations cancel the in-flight stream cleanly.
      const abortController = new AbortController()
      footerAbortRef.current = abortController
      const { signal } = abortController

      const footerPlace = DownloadPlace.DOWNLOAD_SUCCESS_FOOTER
      let tracker: DownloadTracker | null = null

      try {
        const { url, filename } = await calculateDownloadUrl({
          os: clientOS,
          arch: clientArch,
          fallbackLinks: FALLBACK_CDN_RELEASE_LINKS,
          getIdentityId,
          anonUserId
        })
        const downloadUrl = addQueryParamsToUrlString(url, { [ANON_USER_ID_PARAM]: anonUserId })

        tracker = createDownloadTracker(deferredTrack, {
          place: footerPlace,
          href: downloadUrl,
          os: clientOS,
          arch: clientArch,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          anon_user_id: anonUserId ?? undefined,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          auth_state: authState,
          revisit: revisitNumber
        })

        tracker.started()

        const result = await streamOrFallback({
          url: downloadUrl,
          filename,
          os: clientOS,
          signal,
          onProgress: setDownloadProgress
        })

        if (signal.aborted) return
        setDownloadProgress(100)
        tracker.success(filename, result.bytesTransferred)
      } catch (error) {
        if (signal.aborted) return
        console.error('Download error:', error)
        const reason = error instanceof Error ? error.message : 'Download failed'
        setDownloadError(reason)

        if (tracker) {
          tracker.failed(reason)
        } else {
          const fallbackTracker = createDownloadTracker(deferredTrack, {
            place: footerPlace,
            href: osLink,
            os: clientOS,
            arch: clientArch,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            anon_user_id: anonUserId ?? undefined,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            auth_state: authState,
            revisit: revisitNumber
          })
          fallbackTracker.failed(reason)
        }
      } finally {
        downloadingRef.current = false
        if (!signal.aborted) {
          setIsDownloading(false)
        }
        if (footerAbortRef.current === abortController) {
          footerAbortRef.current = null
        }
      }
    },
    [clientOS, clientArch, anonUserId, getIdentityId, osLink, authState, revisitNumber, deferredTrack]
  )

  // Cancel any in-flight footer-initiated stream when the page unmounts so
  // we don't leak the connection (and per-chunk setState calls) into a
  // destroyed component tree.
  useEffect(
    () => () => {
      footerAbortRef.current?.abort()
    },
    []
  )

  const showBackdrop = isDownloading || (!downloadError && !isFileSaved)

  const backdropContent = isDownloading ? (
    <DownloadBackdropContent>
      <Logo size="huge" />
      <DownloadDetailContainer>
        <DownloadBackdropText variant="h6">{l('page.download.downloading')}</DownloadBackdropText>
        <DownloadProgressContainer>
          {downloadProgress !== null ? <DownloadProgressBar variant="determinate" value={downloadProgress} /> : <DownloadProgressBar />}
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
              <a href={osLink} onClick={handleDownloadClick} data-event={SegmentEvent.DOWNLOAD}>
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
