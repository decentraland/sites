import { memo, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from '@dcl/hooks'
import { FooterLanding } from 'decentraland-ui2/dist/components/FooterLanding/FooterLanding'
import { Logo, Typography } from 'decentraland-ui2'
import { Repo, useLatestGithubRelease } from '../../hooks/useLatestGithubRelease'
import appleLogo from '../../images/apple-logo.svg'
import macOsSetup from '../../images/download/creator-hub/mac_setup.svg'
import macOsAppIcon from '../../images/download/creator-hub/macos_app_icon.svg'
import macOsDownloadFolder from '../../images/download/creator-hub/macos_downloads_folder.svg'
import windowsAppIcon from '../../images/download/creator-hub/windows_app_icon.svg'
import windowsDownloadFolder from '../../images/download/creator-hub/windows_downloads_folder.svg'
import windowsSetup from '../../images/download/creator-hub/windows_setup.svg'
import microsoftLogo from '../../images/microsoft-logo.svg'
import { triggerFileDownload } from '../../modules/file'
import { Architecture, OperativeSystem } from '../../types/download.types'
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
  DownloadSuccessTitle
} from '../DownloadSuccess/DownloadSuccess.styled'
import type { DownloadSuccessStep, DownloadSuccessStepsWithOs } from '../DownloadSuccess/DownloadSuccess.types'

const VALID_ARCHS = new Set<string>(['amd64', 'arm64'])

const CreatorHubDownloadSuccess = memo(() => {
  const [searchParams] = useSearchParams()
  const { intl } = useTranslation()
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const l = useCallback((id: string, values?: Record<string, any>) => intl.formatMessage({ id }, values), [intl])

  const productAction = l('page.download.success.subtitle_action_creating') as string

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

  const handleDownloadClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      if (osLink) {
        triggerFileDownload(osLink)
      }
    },
    [osLink]
  )

  return (
    <>
      <DownloadBackdrop open={isLoadingLinks}>
        <DownloadBackdropContent>
          <Logo size="huge" />
          <DownloadDetailContainer>
            <DownloadBackdropText variant="h6">{l('page.download.downloading')}</DownloadBackdropText>
            <DownloadProgressContainer>
              <DownloadProgressBar />
            </DownloadProgressContainer>
          </DownloadDetailContainer>
        </DownloadBackdropContent>
      </DownloadBackdrop>

      <DownloadSuccessPageContainer>
        <DownloadSuccessHeaderContainer>
          <DownloadSuccessOsIcon src={osIcon} alt="" loading="lazy" />
          <DownloadSuccessTitle variant="h3">{l('page.download.success.title')}</DownloadSuccessTitle>
          <DownloadSuccessSubtitle variant="h5">{l('page.download.success.subtitle', { action: productAction })}</DownloadSuccessSubtitle>
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
            </DownloadSuccessCard>
          ))}
        </DownloadSuccessCardWrapper>

        <DownloadSuccessFooterContainer>
          <Typography variant="body1">
            {l('page.download.success.footer', {
              link: (
                <a href={osLink} onClick={handleDownloadClick}>
                  {l('page.creator-hub.download.success.footer_link_label')}
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

CreatorHubDownloadSuccess.displayName = 'CreatorHubDownloadSuccess'

export { CreatorHubDownloadSuccess }
