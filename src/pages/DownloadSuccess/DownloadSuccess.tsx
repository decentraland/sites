import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from '@dcl/hooks'
import { Logo, Typography } from 'decentraland-ui2'
import { LandingFooter } from '../../components/LandingFooter'
import { ANON_USER_ID_PARAM, useAnonUserId } from '../../hooks/useAnonUserId'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useDownloadFunnelExit } from '../../hooks/useDownloadFunnelExit'
import { useGetIdentityId } from '../../hooks/useGetIdentityId'
import appleLogo from '../../images/apple-logo.svg'
import macOsLauncher from '../../images/download/macos_launcher.webp'
import macOsLaunchingDecentraland from '../../images/download/macos_launching_decentraland.webp'
import macOsRecentDownload from '../../images/download/macos_recent_download.webp'
import windowsDownloadsFolder from '../../images/download/windows_downloads_folder.webp'
import windowsLaunchingDecentraland from '../../images/download/windows_launching_decentraland.webp'
import windowsSetup from '../../images/download/windows_setup.webp'
import microsoftLogo from '../../images/microsoft-logo.svg'
import { collectCampaignParams } from '../../modules/campaignParams'
import { readDownloadClickCorrelation } from '../../modules/downloadClickCorrelation'
import type { DownloadFunnelExitData } from '../../modules/downloadFunnelExit.types'
import { captureDownloadError, recordDownloadMilestone } from '../../modules/downloadFunnelSentry'
import { createDownloadTracker, toAuthState } from '../../modules/downloadTracking'
import type { DownloadTracker } from '../../modules/downloadTracking.types'
import { calculateDownloadUrl } from '../../modules/downloadWithIdentity'
import { collectClientFingerprint } from '../../modules/fingerprint'
import { DownloadPlace, DownloadTarget, SegmentEvent, resolveDownloadPlace } from '../../modules/segment'
import { ensureSegmentAnonymousId } from '../../modules/segmentAnonymousId'
import { postSegmentEvent } from '../../modules/segmentBeacon'
import { streamOrFallback } from '../../modules/streamOrFallback'
import type { StreamOrFallbackResult } from '../../modules/streamOrFallback.types'
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

/**
 * Maps a resolved download into the event-level extras appended to
 * `download_success`: which path delivered it (`delivery_mode`) and, on the
 * streamed path, the gateway's `X-Request-Id` for the client↔server join.
 * `gateway_request_id` is omitted when absent (macOS / anchor fallback / CDN).
 */
const buildDeliveryExtra = (result: StreamOrFallbackResult): Record<string, unknown> => {
  /* eslint-disable @typescript-eslint/naming-convention */
  const extra: Record<string, unknown> = { delivery_mode: result.deliveryMode }
  if (result.gatewayRequestId) {
    extra.gateway_request_id = result.gatewayRequestId
  }
  /* eslint-enable @typescript-eslint/naming-convention */
  return extra
}

const DownloadSuccess = memo(() => {
  const [searchParams] = useSearchParams()
  const { intl } = useTranslation()
  const getIdentityId = useGetIdentityId()
  const anonUserId = useAnonUserId()
  const { hasValidIdentity } = useAuthIdentity()
  // 'authenticated' = the visitor has an auth identity in localStorage at the
  // moment the download is triggered (i.e. they had previously logged in).
  // 'anonymous' = no identity, the campaign attribution chain relies entirely
  // on anon_user_id. Useful for breaking down the funnel by login state and
  // for catching regressions where authenticated users fall back to the
  // anonymous gateway path.
  const authState = toAuthState(hasValidIdentity)

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

  // Diagnostic state for `download_funnel_exit`: which download_* events had
  // fired by the time the user leaves, and how long they stayed. Refs (not
  // state) so flipping them never re-renders and the visibility (hidden)
  // handler reads the latest values. `pageLoadedAtRef` is stamped once at
  // first render.
  const startedFiredRef = useRef(false)
  const successFiredRef = useRef(false)
  const failedFiredRef = useRef(false)
  const pageLoadedAtRef = useRef(Date.now())

  // Wraps a tracker so every download_* event also records that it fired,
  // without sprinkling ref writes across the four tracker call sites.
  const withFiredRefs = useCallback(
    (tracker: DownloadTracker): DownloadTracker => ({
      started: () => {
        startedFiredRef.current = true
        recordDownloadMilestone('download_started')
        tracker.started()
      },
      success: (filename, bytesTransferred, extra) => {
        successFiredRef.current = true
        tracker.success(filename, bytesTransferred, extra)
      },
      failed: (reason, extra) => {
        failedFiredRef.current = true
        tracker.failed(reason, extra)
      }
    }),
    []
  )

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

  // Single source of truth for the Sentry tags shared by both catch blocks.
  // `errorPlace` is the flow's own place (page-level for auto-download,
  // DOWNLOAD_SUCCESS_FOOTER for the re-download) so the Sentry issue joins to
  // the matching `download_failed` event; `step` marks where it broke.
  const buildDownloadErrorTags = useCallback(
    (errorPlace: DownloadPlace, step: 'stream' | 'calculate_url'): Record<string, string | undefined> => ({
      feature: 'download_funnel',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      click_id: readDownloadClickCorrelation()?.click_id,
      place: errorPlace,
      os: clientOS,
      arch: clientArch,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      download_target: DownloadTarget.DESKTOP_INSTALLER,
      step
    }),
    [clientOS, clientArch]
  )

  // Partner campaign params (utm_*) forwarded from the /download landing click.
  // Captured off the URL and re-attached to every download_* event so the
  // desktop installer funnel keeps the attribution the landing click carried.
  const campaignParams = useMemo(() => collectCampaignParams(searchParams), [searchParams])
  const campaignParamsRef = useRef(campaignParams)
  campaignParamsRef.current = campaignParams

  // Shared `extra` for every tracker built on this page: the client
  // fingerprint, the campaign params, the click→download correlation, and
  // `download_target: desktop_installer`. Every landing on /download_success
  // is a desktop installer attempt — the mobile App Store / Google Play CTAs
  // exit to their stores and never reach this page — so tagging it lets
  // analytics exclude mobile store exits from the desktop activation metric.
  // Non-throwing by contract: this runs in the footer click handler BEFORE its
  // try/finally arms (a throw there would latch `downloadingRef` and brick the
  // button) and again INSIDE the mount effect's catch when building the
  // download_failed fallback (a throw there would kill the fallback emission).
  // Attribution extras are best-effort — they must never break the download.
  // Only `collectClientFingerprint()` can realistically throw, so the try/catch
  // is scoped to just that call (ex P2-4: a wider try/catch here used to let a
  // fingerprint failure also drop the utm_* campaign params).
  const buildTrackerExtra = useCallback((): Record<string, unknown> => {
    let fingerprint: Record<string, unknown> = {}
    try {
      // Spread into a fresh literal: ClientFingerprint has no index signature,
      // so it isn't directly assignable to Record<string, unknown>.
      fingerprint = { ...(collectClientFingerprint() ?? {}) }
    } catch (error) {
      console.error('collectClientFingerprint failed:', error)
    }
    const correlation = readDownloadClickCorrelation()
    return {
      ...fingerprint,
      ...campaignParamsRef.current,
      ...(correlation
        ? {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            click_id: correlation.click_id,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            ms_since_click: Date.now() - correlation.clicked_at
          }
        : {}),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      download_target: DownloadTarget.DESKTOP_INSTALLER
    }
  }, [])

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

  // Page-arrival marker: splits the click→started drop into "never arrived"
  // (Click with no arrived) vs "arrived but never fired started" (arrived
  // with no started). Fires before the anon_user_id gate on purpose — it
  // measures the document's arrival, not Segment's readiness. `place` is
  // ALWAYS included (even 'unknown') so direct landings are measurable,
  // unlike the tracker, which omits it.
  const arrivedFiredRef = useRef(false)
  useEffect(() => {
    if (arrivedFiredRef.current) return
    arrivedFiredRef.current = true
    const correlation = readDownloadClickCorrelation()
    const now = Date.now()
    /* eslint-disable @typescript-eslint/naming-convention */
    postSegmentEvent(
      SegmentEvent.DOWNLOAD_SUCCESS_ARRIVED,
      {
        os: clientOS,
        arch: clientArch,
        place,
        revisit: revisitNumber,
        auth_state: authStateRef.current,
        ...campaignParamsRef.current,
        ...(correlation ? { click_id: correlation.click_id, ms_since_click: now - correlation.clicked_at } : {}),
        download_target: DownloadTarget.DESKTOP_INSTALLER,
        // track_delivered_at intentionally mirrors track_called_at — the
        // beacon transport (sendBeacon/fetch keepalive) never reports actual
        // delivery time, so this isn't a latency measurement. Matches the
        // same audit-field convention already shipped by withTrackAuditFields
        // (downloadTracking.ts) and useDownloadClick's cold path.
        track_called_at: now,
        track_delivered_at: now,
        track_deferred: true
      },
      ensureSegmentAnonymousId()
    )
    /* eslint-enable @typescript-eslint/naming-convention */
    recordDownloadMilestone('download_success_arrived')
  }, [clientOS, clientArch, place, revisitNumber])

  // Gate the auto-download on the anon_user_id resolution. `useAnonUserId` is
  // reactive to `isInitialized` (see hook docstring), so a cold load that
  // mounts before Segment boots starts with `anonUserId === undefined`, then
  // flips to the real value once Segment writes `ajs_anonymous_id` to
  // localStorage. We wait up to ANON_USER_ID_WAIT_MS for that — beyond which
  // we proceed anyway so the UX doesn't hang on a blocked / failing Segment.
  const [anonUserIdReady, setAnonUserIdReady] = useState(anonUserId !== undefined)
  useEffect(() => {
    if (anonUserId !== undefined) {
      setAnonUserIdReady(true)
      return
    }
    if (anonUserIdReady) return
    const timer = setTimeout(() => setAnonUserIdReady(true), 800)
    return () => clearTimeout(timer)
  }, [anonUserId, anonUserIdReady])

  useEffect(() => {
    if (!anonUserIdReady) return
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

        const downloadUrl = addQueryParamsToUrlString(url, {
          [ANON_USER_ID_PARAM]: anonUserIdRef.current,
          // Forwarded so the gateway echoes it into its server-side telemetry,
          // closing the click→download join without relying on the beacon.
          // eslint-disable-next-line @typescript-eslint/naming-convention
          click_id: readDownloadClickCorrelation()?.click_id
        })

        // Fingerprint snapshot used by the data team's server-side join to
        // match this download with the launcher's first-run event from the
        // same machine, plus campaign params + download_target. Lives in
        // `extra` so every event the tracker emits carries it without polluting
        // the tracker's core schema.
        tracker = withFiredRefs(
          createDownloadTracker({
            place,
            href: downloadUrl,
            os: clientOS,
            arch: clientArch,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            anon_user_id: anonUserIdRef.current ?? undefined,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            auth_state: authStateRef.current,
            revisit: revisitNumber,
            extra: buildTrackerExtra()
          })
        )

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
        tracker.success(filename, result.bytesTransferred, buildDeliveryExtra(result))
      } catch (error) {
        if (signal.aborted) return
        console.error('Download error:', error)
        const reason = error instanceof Error ? error.message : 'Download failed'
        setDownloadError(reason)

        // Segment records THAT the download failed (download_failed); Sentry
        // records WHY, with the stack trace + milestone buffer. click_id tags
        // the issue so a warehouse drop row joins to the exact Sentry error.
        void captureDownloadError(error, buildDownloadErrorTags(place, tracker ? 'stream' : 'calculate_url'))

        if (tracker) {
          tracker.failed(reason)
        } else {
          // URL resolution rejected — no downloadUrl in hand. Emit `_FAILED`
          // with osLink as the best-known href so analytics still records the
          // attempt with consistent shape.
          const fallbackTracker = withFiredRefs(
            createDownloadTracker({
              place,
              href: osLink,
              os: clientOS,
              arch: clientArch,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              anon_user_id: anonUserIdRef.current ?? undefined,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              auth_state: authStateRef.current,
              revisit: revisitNumber,
              extra: buildTrackerExtra()
            })
          )
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
  }, [anonUserIdReady, clientOS, clientArch, osLink, place, revisitNumber, withFiredRefs, buildTrackerExtra])

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
      const extra = buildTrackerExtra()

      try {
        const { url, filename } = await calculateDownloadUrl({
          os: clientOS,
          arch: clientArch,
          fallbackLinks: FALLBACK_CDN_RELEASE_LINKS,
          getIdentityId,
          anonUserId
        })
        const downloadUrl = addQueryParamsToUrlString(url, {
          [ANON_USER_ID_PARAM]: anonUserId,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          click_id: readDownloadClickCorrelation()?.click_id
        })

        tracker = withFiredRefs(
          createDownloadTracker({
            place: footerPlace,
            href: downloadUrl,
            os: clientOS,
            arch: clientArch,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            anon_user_id: anonUserId ?? undefined,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            auth_state: authState,
            revisit: revisitNumber,
            extra
          })
        )

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
        tracker.success(filename, result.bytesTransferred, buildDeliveryExtra(result))
      } catch (error) {
        if (signal.aborted) return
        console.error('Download error:', error)
        const reason = error instanceof Error ? error.message : 'Download failed'
        setDownloadError(reason)

        // Segment records THAT the download failed (download_failed); Sentry
        // records WHY, with the stack trace + milestone buffer. click_id tags
        // the issue so a warehouse drop row joins to the exact Sentry error.
        void captureDownloadError(error, buildDownloadErrorTags(footerPlace, tracker ? 'stream' : 'calculate_url'))

        if (tracker) {
          tracker.failed(reason)
        } else {
          const fallbackTracker = withFiredRefs(
            createDownloadTracker({
              place: footerPlace,
              href: osLink,
              os: clientOS,
              arch: clientArch,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              anon_user_id: anonUserId ?? undefined,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              auth_state: authState,
              revisit: revisitNumber,
              extra
            })
          )
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
    [clientOS, clientArch, anonUserId, getIdentityId, osLink, authState, revisitNumber, withFiredRefs, buildTrackerExtra]
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

  // Diagnostic: snapshot the funnel state on departure so we can measure how
  // many sessions leave before the download_* events fire/deliver. Reads refs
  // at fire time; os/arch/place/revisit are stable per page.
  const getExitData = useCallback(
    (): DownloadFunnelExitData => ({
      os: clientOS,
      arch: clientArch,
      place,
      anonUserId: anonUserIdRef.current ?? undefined,
      clickId: readDownloadClickCorrelation()?.click_id,
      startedFired: startedFiredRef.current,
      successFired: successFiredRef.current,
      failedFired: failedFiredRef.current,
      msOnPage: Date.now() - pageLoadedAtRef.current,
      revisit: revisitNumber,
      authState: authStateRef.current
    }),
    [clientOS, clientArch, place, revisitNumber]
  )
  // Only measure sessions that entered via a download CTA — a known `place`
  // means a button click navigated here. Direct/campaign landings, refreshes
  // and bots resolve to UNKNOWN and aren't part of the click → download funnel.
  useDownloadFunnelExit(getExitData, place !== DownloadPlace.UNKNOWN)

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
