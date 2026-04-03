import { memo } from 'react'
import type { ReactNode } from 'react'
import type { SxProps, Theme } from 'decentraland-ui2'
import { Logo, Typography } from 'decentraland-ui2'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
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
} from './DownloadSuccess.styled'
import type { DownloadSuccessStep } from './DownloadSuccess.types'

type DownloadSuccessLayoutProps = {
  /** Whether the loading backdrop is visible */
  loading: boolean
  /** Content to render inside the backdrop (defaults to standard loading indicator) */
  backdropContent?: ReactNode
  /** The OS icon to display in the header */
  osIcon: string
  /** The page title */
  title: ReactNode
  /** The page subtitle */
  subtitle: ReactNode
  /** The steps to render as cards */
  steps: DownloadSuccessStep[]
  /** Optional render function for extra content on a card (e.g. highlight animation) */
  renderCardOverlay?: (step: DownloadSuccessStep, index: number) => ReactNode
  /** Footer content */
  footer: ReactNode
  /** Content rendered after the page container (e.g. LandingFooter) */
  afterContent?: ReactNode
  /** Optional sx overrides for the page container */
  containerSx?: SxProps<Theme>
}

const DownloadSuccessLayout = memo(
  ({ loading, backdropContent, osIcon, title, subtitle, steps, renderCardOverlay, footer, afterContent, containerSx }: DownloadSuccessLayoutProps) => {
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

        <DownloadSuccessPageContainer sx={containerSx}>
          <DownloadSuccessHeaderContainer>
            <DownloadSuccessOsIcon src={osIcon} alt="" loading="lazy" />
            <DownloadSuccessTitle variant="h3">{title}</DownloadSuccessTitle>
            <DownloadSuccessSubtitle variant="h5">{subtitle}</DownloadSuccessSubtitle>
          </DownloadSuccessHeaderContainer>

          <DownloadSuccessCardWrapper>
            {steps.map((step, index) => (
              <DownloadSuccessCard key={index}>
                <DownloadSuccessCardContent>
                  <Typography variant="overline">
                    {l('page.download.success.step')} {index + 1}
                  </Typography>
                  <DownloadSuccessCardTitle variant="h4">{step.title}</DownloadSuccessCardTitle>
                  <DownloadSuccessCardSubtitle variant="body1">{step.text}</DownloadSuccessCardSubtitle>
                </DownloadSuccessCardContent>
                <DownloadSuccessCardMedia image={step.image} />
                {renderCardOverlay?.(step, index)}
              </DownloadSuccessCard>
            ))}
          </DownloadSuccessCardWrapper>

          <DownloadSuccessFooterContainer>{footer}</DownloadSuccessFooterContainer>
        </DownloadSuccessPageContainer>

        {afterContent}
      </>
    )
  }
)

DownloadSuccessLayout.displayName = 'DownloadSuccessLayout'

export { DownloadSuccessLayout }
export type { DownloadSuccessLayoutProps }
