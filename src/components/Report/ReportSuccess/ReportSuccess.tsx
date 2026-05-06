import { Navigate, useLocation } from 'react-router-dom'
import { AnimatedBackground, Typography } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import type { ReportSuccessLocationState } from './ReportSuccess.types'
import {
  SuccessBackground,
  SuccessCard,
  SuccessContent,
  SuccessLogo,
  SuccessLogoWrapper,
  SuccessSecondary,
  SuccessTextGroup,
  SuccessTitle
} from './ReportSuccess.styled'

function ReportSuccess() {
  const formatMessage = useFormatMessage()
  const location = useLocation()
  const submitted = (location.state as ReportSuccessLocationState | null)?.submitted

  if (!submitted) {
    return <Navigate to="/report" replace />
  }

  return (
    <SuccessBackground>
      <AnimatedBackground variant="absolute" />
      <SuccessContent>
        <SuccessCard>
          <SuccessLogoWrapper>
            <SuccessLogo size="large" />
            <SuccessTitle variant="h3">{formatMessage('component.report.success.title')}</SuccessTitle>
          </SuccessLogoWrapper>

          <SuccessTextGroup>
            <Typography variant="body1">{formatMessage('component.report.success.body')}</Typography>
            <SuccessSecondary>{formatMessage('component.report.success.dismiss')}</SuccessSecondary>
          </SuccessTextGroup>
        </SuccessCard>
      </SuccessContent>
    </SuccessBackground>
  )
}

export { ReportSuccess }
