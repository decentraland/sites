import { memo, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Logo, Typography } from 'decentraland-ui2'
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

const RichText = memo(({ html }: { html: string }) => {
  const ALLOWED_TAGS = /(<\/?(b|strong|em|i)>)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  const tagStack: string[] = []
  const tokens = [...html.matchAll(ALLOWED_TAGS)]

  for (const match of tokens) {
    const [fullMatch, , tagName] = match
    const idx = match.index
    if (idx > lastIndex) {
      parts.push(html.slice(lastIndex, idx))
    }
    const isClosing = fullMatch.startsWith('</')
    if (isClosing) {
      if (tagStack.length > 0 && tagStack[tagStack.length - 1] === tagName) {
        tagStack.pop()
      }
    } else {
      tagStack.push(tagName)
    }
    // Render allowed tags by pushing marker tokens; we build a simple flat
    // model: every opening tag starts collecting children until its close.
    parts.push(fullMatch)
    lastIndex = idx + fullMatch.length
  }
  if (lastIndex < html.length) {
    parts.push(html.slice(lastIndex))
  }

  // Second pass: convert the flat token list into React elements.
  const build = (tokens: React.ReactNode[]): React.ReactNode[] => {
    const result: React.ReactNode[] = []
    let i = 0
    while (i < tokens.length) {
      const token = tokens[i]
      if (typeof token === 'string') {
        const openMatch = /^<(b|strong|em|i)>$/.exec(token)
        if (openMatch) {
          const tag = openMatch[1]
          const closeTag = `</${tag}>`
          const children: React.ReactNode[] = []
          i++
          let depth = 1
          while (i < tokens.length && depth > 0) {
            const inner = tokens[i]
            if (inner === `<${tag}>`) depth++
            else if (inner === closeTag) {
              depth--
              if (depth === 0) break
            }
            children.push(inner)
            i++
          }
          // eslint-disable-next-line @typescript-eslint/naming-convention
          const TagName = tag as 'b' | 'strong' | 'em' | 'i'
          result.push(<TagName key={`${tag}-${i}`}>{build(children)}</TagName>)
          i++
          continue
        }
        result.push(token)
      } else {
        result.push(token)
      }
      i++
    }
    return result
  }

  return <span>{build(parts)}</span>
})
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

      <DownloadSuccessPageContainer sx={{ paddingTop: '120px' }}>
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
            {l('page.download.success.footer_prefix')}{' '}
            <a href={osLink} onClick={handleDownloadClick}>
              {l('page.creator-hub.download.success.footer_link_label')}
            </a>
          </Typography>
        </DownloadSuccessFooterContainer>
      </DownloadSuccessPageContainer>
    </>
  )
})

CreatorHubDownloadSuccess.displayName = 'CreatorHubDownloadSuccess'

export { CreatorHubDownloadSuccess }
