import { memo, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Typography } from 'decentraland-ui2'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
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
import type { DownloadSuccessStep, DownloadSuccessStepsWithOs } from '../DownloadSuccess/DownloadSuccess.types'
import { DownloadSuccessLayout } from '../DownloadSuccess/DownloadSuccessLayout'

const VALID_ARCHS = new Set<string>(['amd64', 'arm64'])

// eslint-disable-next-line @typescript-eslint/naming-convention
const RichText = memo(({ html }: { html: string }) => <span dangerouslySetInnerHTML={{ __html: html }} />)
RichText.displayName = 'RichText'

const CreatorHubDownloadSuccess = memo(() => {
  const [searchParams] = useSearchParams()
  const l = useFormatMessage()
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

  const productAction = l('page.download.success.subtitle_action_creating')

  const steps: DownloadSuccessStepsWithOs = useMemo(
    () => ({
      [OperativeSystem.WINDOWS]: [
        {
          title: l('page.creator-hub.download.success.steps.windows.step1.title'),
          text: <RichText html={l('page.creator-hub.download.success.steps.windows.step1.text')} />,
          image: windowsDownloadFolder
        },
        {
          title: l('page.creator-hub.download.success.steps.windows.step2.title'),
          text: <RichText html={l('page.creator-hub.download.success.steps.windows.step2.text')} />,
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
          text: <RichText html={l('page.creator-hub.download.success.steps.macos.step1.text')} />,
          image: macOsDownloadFolder
        },
        {
          title: l('page.creator-hub.download.success.steps.macos.step2.title'),
          text: <RichText html={l('page.creator-hub.download.success.steps.macos.step2.text')} />,
          image: macOsSetup
        },
        {
          title: l('page.creator-hub.download.success.steps.macos.step3.title'),
          text: <RichText html={l('page.creator-hub.download.success.steps.macos.step3.text')} />,
          image: macOsAppIcon
        }
      ]
    }),
    [l]
  )

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
    <DownloadSuccessLayout
      loading={isLoadingLinks}
      osIcon={osIcon}
      title={l('page.download.success.title')}
      subtitle={l('page.download.success.subtitle', { action: productAction })}
      steps={currentSteps}
      footer={
        <Typography variant="body1">
          {l('page.download.success.footer_prefix')}{' '}
          <a href={osLink} onClick={handleDownloadClick}>
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
