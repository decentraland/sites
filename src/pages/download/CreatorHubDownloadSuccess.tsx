import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from '@dcl/hooks'
import { Typography } from 'decentraland-ui2'
import { useTrackClick } from '../../hooks/adapters/useTrackLinkContext'
import { useAnonUserId } from '../../hooks/useAnonUserId'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { Repo, useLatestGithubRelease } from '../../hooks/useLatestGithubRelease'
import appleLogo from '../../images/apple-logo.svg'
import macOsSetup from '../../images/download/creator-hub/mac_setup.svg'
import macOsAppIcon from '../../images/download/creator-hub/macos_app_icon.svg'
import macOsDownloadFolder from '../../images/download/creator-hub/macos_downloads_folder.svg'
import windowsAppIcon from '../../images/download/creator-hub/windows_app_icon.svg'
import windowsDownloadFolder from '../../images/download/creator-hub/windows_downloads_folder.svg'
import windowsSetup from '../../images/download/creator-hub/windows_setup.svg'
import microsoftLogo from '../../images/microsoft-logo.svg'
import { createDownloadTracker, toAuthState } from '../../modules/downloadTracking'
import { triggerFileDownload } from '../../modules/file'
import { DownloadPlace, DownloadTarget, SectionViewedTrack, SegmentEvent } from '../../modules/segment'
import { Architecture, OperativeSystem } from '../../types/download.types'
import type { DownloadSuccessStep, DownloadSuccessStepsWithOs } from '../DownloadSuccess/DownloadSuccess.types'
import { DownloadSuccessLayout } from '../DownloadSuccess/DownloadSuccessLayout'

const VALID_ARCHS = new Set<string>(['amd64', 'arm64'])

const CreatorHubDownloadSuccess = memo(() => {
  const [searchParams] = useSearchParams()
  const { intl } = useTranslation()
  const trackClick = useTrackClick()
  const anonUserId = useAnonUserId()
  const { hasValidIdentity } = useAuthIdentity()
  const hasTrackedArrivalRef = useRef(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const l = useCallback((id: string, values?: Record<string, any>) => intl.formatMessage({ id }, values), [intl])
  const { links, loading: isLoadingLinks } = useLatestGithubRelease(Repo.CREATOR_HUB)

  const rawOs = searchParams.get('os') || ''
  const osMap: Record<string, OperativeSystem> = {
    windows: OperativeSystem.WINDOWS,
    macos: OperativeSystem.MACOS
  }
  const clientOS = osMap[rawOs.toLowerCase()] ?? OperativeSystem.MACOS
  const defaultArch = clientOS === OperativeSystem.WINDOWS ? 'amd64' : 'arm64'
  const rawArch = searchParams.get('arch') || defaultArch
  const clientArch = (VALID_ARCHS.has(rawArch) ? rawArch : defaultArch) as Architecture

  const osIcon = clientOS === OperativeSystem.WINDOWS ? microsoftLogo : appleLogo
  const osLink = links?.[clientOS]?.[clientArch]

  // Revisit counter captured once via a lazy initializer (keyed by os:arch) so
  // refreshes / back-forward navigations of the success page are recorded as
  // revisit:n rather than re-counted as fresh arrivals. Mirrors the Explorer
  // DownloadSuccess flow.
  const [revisitNumber] = useState(() => {
    const visitsKey = `creatorHubDownloadSuccess:visits:${clientOS}:${clientArch}`
    const current = Number(sessionStorage.getItem(visitsKey) ?? '0')
    sessionStorage.setItem(visitsKey, String(current + 1))
    return current
  })

  // Reaching this page is the completion signal for the Creator Hub download
  // funnel — the file was already triggered on the previous page. Fire
  // download_success via the shared tracker so the payload shape matches the
  // Explorer funnel (the data team joins it to download_started by
  // anon_user_id + place). Gated on osLink so href/filename are meaningful and
  // guarded by a ref so React strict-mode double-invoke fires it only once.
  useEffect(() => {
    if (hasTrackedArrivalRef.current) return
    if (!osLink) return
    hasTrackedArrivalRef.current = true

    const filename = osLink.split('/').pop() || ''
    const tracker = createDownloadTracker({
      href: osLink,
      os: clientOS,
      arch: clientArch,
      place: DownloadPlace.CREATOR_HUB_SUCCESS_PAGE,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      anon_user_id: anonUserId,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      auth_state: toAuthState(hasValidIdentity),
      revisit: revisitNumber
    })
    tracker.success(filename)
  }, [osLink, clientOS, clientArch, anonUserId, hasValidIdentity, revisitNumber])

  const productAction = l('page.download.success.subtitle_action_creating')

  const steps: DownloadSuccessStepsWithOs = useMemo(() => {
    const spanTag = (chunks: React.ReactNode) => <span>{chunks}</span>

    return {
      [OperativeSystem.WINDOWS]: [
        {
          title: l('page.creator-hub.download.success.steps.windows.step1.title'),
          text: l('page.creator-hub.download.success.steps.windows.step1.text', { span: spanTag }),
          image: windowsDownloadFolder
        },
        {
          title: l('page.creator-hub.download.success.steps.windows.step2.title'),
          text: l('page.creator-hub.download.success.steps.windows.step2.text', { span: spanTag }),
          image: windowsSetup
        },
        {
          title: l('page.creator-hub.download.success.steps.windows.step3.title'),
          text: l('page.creator-hub.download.success.steps.windows.step3.text'),
          image: windowsAppIcon
        }
      ],
      [OperativeSystem.MACOS]: [
        {
          title: l('page.creator-hub.download.success.steps.macos.step1.title'),
          text: l('page.creator-hub.download.success.steps.macos.step1.text', { span: spanTag }),
          image: macOsDownloadFolder
        },
        {
          title: l('page.creator-hub.download.success.steps.macos.step2.title'),
          text: l('page.creator-hub.download.success.steps.macos.step2.text', { span: spanTag }),
          image: macOsSetup
        },
        {
          title: l('page.creator-hub.download.success.steps.macos.step3.title'),
          text: l('page.creator-hub.download.success.steps.macos.step3.text', { span: spanTag }),
          image: macOsAppIcon
        }
      ]
    }
  }, [l])

  const currentSteps: DownloadSuccessStep[] = steps[clientOS] || steps[OperativeSystem.MACOS]

  // Track the footer re-download via the standard Click adapter — same data-*
  // convention as every other download CTA in the codebase.
  const handleDownloadClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      if (!osLink) return
      trackClick(event)
      triggerFileDownload(osLink)
    },
    [osLink, trackClick]
  )

  return (
    <DownloadSuccessLayout
      loading={isLoadingLinks}
      osIcon={osIcon}
      title={l('page.download.success.title')}
      subtitle={l('page.download.success.subtitle', { action: productAction })}
      steps={currentSteps}
      footer={
        <Typography variant="body1">
          {l('page.download.success.footer_prefix')}{' '}
          <a
            href={osLink}
            onClick={handleDownloadClick}
            data-place={SectionViewedTrack.CREATOR_HUB_SUCCESS_FOOTER}
            data-event={SegmentEvent.DOWNLOAD}
            data-os={clientOS}
            data-download-target={DownloadTarget.CREATOR_HUB}
          >
            {l('page.creator-hub.download.success.footer_link_label')}
          </a>
        </Typography>
      }
      containerSx={{ paddingTop: '120px' }}
    />
  )
})

CreatorHubDownloadSuccess.displayName = 'CreatorHubDownloadSuccess'

export { CreatorHubDownloadSuccess }
