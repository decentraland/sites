import { memo } from 'react'
import type { ReactNode } from 'react'
import { Logo } from 'decentraland-ui2'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import highlightIcon from '../../images/download/steps/highlight-icon.webp'
import type { DownloadStepsStep } from './DownloadSuccess.types'
import {
  DownloadStepsCardHeader,
  DownloadStepsCardRoot,
  DownloadStepsCardText,
  DownloadStepsCardTitle,
  DownloadStepsCards,
  DownloadStepsFooter,
  DownloadStepsGlow,
  DownloadStepsHeader,
  DownloadStepsHighlight,
  DownloadStepsHighlightIcon,
  DownloadStepsImage,
  DownloadStepsMedia,
  DownloadStepsOverline,
  DownloadStepsPage,
  DownloadStepsSubtitle,
  DownloadStepsTitle
} from './DownloadSteps.styled'
import {
  DownloadBackdrop,
  DownloadBackdropContent,
  DownloadBackdropText,
  DownloadDetailContainer,
  DownloadProgressBar,
  DownloadProgressContainer
} from './DownloadSuccess.styled'

type DownloadStepsLayoutProps = {
  /** Whether the loading backdrop is visible */
  loading: boolean
  /** Content to render inside the backdrop (defaults to the standard loading indicator) */
  backdropContent?: ReactNode
  title: ReactNode
  subtitle: ReactNode
  steps: DownloadStepsStep[]
  footer: ReactNode
  /** Content rendered after the page container (e.g. LandingFooter) */
  afterContent?: ReactNode
}

type DownloadStepsCardProps = {
  step: DownloadStepsStep
  index: number
}

const DownloadStepsCard = memo(({ step, index }: DownloadStepsCardProps) => {
  const l = useFormatMessage()

  return (
    <DownloadStepsCardRoot>
      <DownloadStepsCardHeader step={index}>
        <DownloadStepsOverline variant="overline">
          {l('page.download.success.step')} {index + 1}
        </DownloadStepsOverline>
        <DownloadStepsCardTitle variant="h5">{step.title}</DownloadStepsCardTitle>
        <DownloadStepsCardText variant="body1">{step.text}</DownloadStepsCardText>
      </DownloadStepsCardHeader>
      <DownloadStepsMedia>
        <DownloadStepsImage src={step.image} fit={step.imageFit} alt="" loading="lazy" />
        {step.highlight && (
          <DownloadStepsHighlight x={step.highlight.x} y={step.highlight.y} data-testid="download-steps-highlight">
            <DownloadStepsGlow />
            <DownloadStepsHighlightIcon src={highlightIcon} alt="" />
          </DownloadStepsHighlight>
        )}
      </DownloadStepsMedia>
    </DownloadStepsCardRoot>
  )
})

DownloadStepsCard.displayName = 'DownloadStepsCard'

const DownloadStepsLayout = memo((props: DownloadStepsLayoutProps) => {
  const { loading, backdropContent, title, subtitle, steps, footer, afterContent } = props
  const l = useFormatMessage()

  const defaultBackdropContent = (
    <DownloadBackdropContent>
      <Logo size="huge" />
      <DownloadDetailContainer>
        <DownloadBackdropText variant="h6">{l('page.download.downloading')}</DownloadBackdropText>
        <DownloadProgressContainer>
          <DownloadProgressBar />
        </DownloadProgressContainer>
      </DownloadDetailContainer>
    </DownloadBackdropContent>
  )

  return (
    <>
      <DownloadBackdrop open={loading}>{backdropContent ?? defaultBackdropContent}</DownloadBackdrop>

      <DownloadStepsPage>
        <DownloadStepsHeader>
          <Logo size="huge" />
          <DownloadStepsTitle variant="h3">{title}</DownloadStepsTitle>
          <DownloadStepsSubtitle variant="h5">{subtitle}</DownloadStepsSubtitle>
        </DownloadStepsHeader>

        <DownloadStepsCards>
          {steps.map((step, index) => (
            <DownloadStepsCard key={index} step={step} index={index} />
          ))}
        </DownloadStepsCards>

        <DownloadStepsFooter>{footer}</DownloadStepsFooter>
      </DownloadStepsPage>

      {afterContent}
    </>
  )
})

DownloadStepsLayout.displayName = 'DownloadStepsLayout'

export { DownloadStepsLayout }
