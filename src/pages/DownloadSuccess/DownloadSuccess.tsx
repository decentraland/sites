import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAnalytics, useTranslation } from '@dcl/hooks'
import { FooterLanding } from 'decentraland-ui2/dist/components/FooterLanding/FooterLanding'
import { Logo, Typography } from 'decentraland-ui2'
import { useGetIdentityId } from '../../hooks/useGetIdentityId'
import appleLogo from '../../images/apple-logo.svg'
import macOsLauncher from '../../images/download/macos_launcher.webp'
import macOsLaunchingDecentraland from '../../images/download/macos_launching_decentraland.webp'
import macOsRecentDownload from '../../images/download/macos_recent_download.webp'
import windowsDownloadsFolder from '../../images/download/windows_downloads_folder.webp'
import windowsLaunchingDecentraland from '../../images/download/windows_launching_decentraland.webp'
import windowsSetup from '../../images/download/windows_setup.webp'
import microsoftLogo from '../../images/microsoft-logo.svg'
import { calculateDownloadUrl, downloadWithIdentity } from '../../modules/downloadWithIdentity'
import { triggerFileDownload } from '../../modules/file'
import { SectionViewedTrack, SegmentEvent } from '../../modules/segment'
import { FALLBACK_CDN_RELEASE_LINKS } from '../../modules/url'
import { Architecture, OperativeSystem } from '../../types/download.types'
import type { DownloadSuccessStep, DownloadSuccessStepsWithOs } from './DownloadSuccess.types'
import {
  DownloadBackdrop,
  DownloadBackdropContent,
  DownloadBackdropText,
  DownloadDetailContainer,
  DownloadProgressBar,
  DownloadProgressContainer,
  DownloadSuccessCard,
  DownloadSuccessCardContent,
  DownloadSuccessCardMedia,
  DownloadSuccessCardSubtitle,
  DownloadSuccessCardTitle,
  DownloadSuccessCardWrapper,
  DownloadSuccessFooterContainer,
  DownloadSuccessHeaderContainer,
  DownloadSuccessOsIcon,
  DownloadSuccessPageContainer,
  DownloadSuccessSubtitle,
  DownloadSuccessTitle,
  HighlightAnimation
} from './DownloadSuccess.styled'

const DownloadSuccess = memo(() => {
  const [searchParams] = useSearchParams()
  const { intl } = useTranslation()
  const { isInitialized, track } = useAnalytics()
  const getIdentityId = useGetIdentityId()

  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [isFileSaved, setIsFileSaved] = useState(false)
  const isInitializedRef = useRef(isInitialized)
  const trackRef = useRef(track)
  isInitializedRef.current = isInitialized
  trackRef.current = track

  const rawOs = searchParams.get('os') || ''
  const osMap: Record<string, OperativeSystem> = {
    windows: OperativeSystem.WINDOWS,
    macos: OperativeSystem.MACOS
  }
  const clientOS = osMap[rawOs.toLowerCase()] ?? OperativeSystem.MACOS
  const validArchs = new Set<string>(['amd64', 'arm64'])
  const defaultArch = clientOS === OperativeSystem.WINDOWS ? 'amd64' : 'arm64'
  const rawArch = searchParams.get('arch') || defaultArch
  const clientArch = (validArchs.has(rawArch) ? rawArch : defaultArch) as Architecture

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

    const startDownload = async () => {
      setIsDownloading(true)
      setDownloadError(null)
      setIsFileSaved(false)

      if (isInitializedRef.current) {
        trackRef.current(SegmentEvent.DOWNLOAD_STARTED)
      }

      const { url, filename } = await calculateDownloadUrl({
        os: clientOS,
        arch: clientArch,
        fallbackLinks: FALLBACK_CDN_RELEASE_LINKS,
        getIdentityId
      })

      if (cancelled) return

      triggerFileDownload(url)
      setIsFileSaved(true)

      if (isInitializedRef.current) {
        trackRef.current(SegmentEvent.DOWNLOAD_SUCCESS, { filename })
      }
    }

    startDownload()
      .catch(error => {
        if (cancelled) return
        console.error('Download error:', error)
        setDownloadError(error instanceof Error ? error.message : 'Download failed')
        if (isInitializedRef.current) {
          trackRef.current(SegmentEvent.DOWNLOAD_FAILED)
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
  }, [clientOS, clientArch, getIdentityId])

  const handleDownloadClick = useCallback(
    async (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      if (isDownloading) return

      setIsDownloading(true)
      try {
        await downloadWithIdentity({
          os: clientOS,
          arch: clientArch,
          fallbackLinks: FALLBACK_CDN_RELEASE_LINKS,
          getIdentityId
        })
      } finally {
        setIsDownloading(false)
      }
    },
    [clientOS, clientArch, getIdentityId, isDownloading]
  )

  const showBackdrop = isDownloading || (!downloadError && !isFileSaved)

  return (
    <>
      <DownloadBackdrop open={showBackdrop}>
        {isDownloading && (
          <DownloadBackdropContent>
            <Logo size="huge" />
            <DownloadDetailContainer>
              <DownloadBackdropText variant="h6">{l('page.download.downloading')}</DownloadBackdropText>
              <DownloadProgressContainer>
                <DownloadProgressBar />
              </DownloadProgressContainer>
            </DownloadDetailContainer>
          </DownloadBackdropContent>
        )}
      </DownloadBackdrop>

      <DownloadSuccessPageContainer>
        <DownloadSuccessHeaderContainer>
          <DownloadSuccessOsIcon src={osIcon} alt="" loading="lazy" />
          <DownloadSuccessTitle variant="h3">{l('page.download.success.title')}</DownloadSuccessTitle>
          <DownloadSuccessSubtitle variant="h5">
            {l('page.download.success.subtitle', {
              action: productAction
            })}
          </DownloadSuccessSubtitle>
        </DownloadSuccessHeaderContainer>

        <DownloadSuccessCardWrapper>
          {currentSteps.map((step, index) => (
            <DownloadSuccessCard key={index}>
              <DownloadSuccessCardContent>
                <Typography variant="overline">
                  {l('page.download.success.step')} {index + 1}
                </Typography>
                <DownloadSuccessCardTitle variant="h4">{step.title}</DownloadSuccessCardTitle>
                <DownloadSuccessCardSubtitle variant="body1">{step.text}</DownloadSuccessCardSubtitle>
              </DownloadSuccessCardContent>
              <DownloadSuccessCardMedia image={step.image} />
              {index === 0 && productAction === 'exploring' && <HighlightAnimation />}
            </DownloadSuccessCard>
          ))}
        </DownloadSuccessCardWrapper>

        <DownloadSuccessFooterContainer>
          <Typography variant="body1">
            {l('page.download.success.footer', {
              link: (
                <a href={osLink} onClick={handleDownloadClick} data-event={SectionViewedTrack.DOWNLOAD}>
                  {l('page.download.success.footer_link_label')}
                </a>
              )
            })}
          </Typography>
        </DownloadSuccessFooterContainer>
      </DownloadSuccessPageContainer>

      <FooterLanding />
    </>
  )
})

DownloadSuccess.displayName = 'DownloadSuccess'

export { DownloadSuccess }
