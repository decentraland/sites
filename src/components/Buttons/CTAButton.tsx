import { memo } from 'react'
import { CircularProgress } from 'decentraland-ui2'
import { CTAButtonProps } from './CTAButton.types'
import { CTAButtonLabelContainer, CTAButtonStyled } from './CTAButton.styled'

const CTAButton = memo((props: CTAButtonProps) => {
  const { href, onClick, label, subLabel, place, event, isFullWidth, startIcon, endIcon, isLoading } = props
  return (
    <CTAButtonStyled
      variant="contained"
      data-place={place}
      data-event={event || 'click'}
      href={href}
      onClick={onClick}
      fullWidth={isFullWidth}
      startIcon={startIcon}
      endIcon={endIcon}
      disabled={isLoading}
    >
      {isLoading && <CircularProgress size={24} color="inherit" />}
      {!isLoading && (
        <CTAButtonLabelContainer>
          {label}
          {subLabel && <span>{subLabel}</span>}
        </CTAButtonLabelContainer>
      )}
    </CTAButtonStyled>
  )
})

CTAButton.displayName = 'CTAButton'

export { CTAButton }
