import * as React from 'react'
import { CircularProgress } from 'decentraland-ui2'
import { DownloadButtonProps } from './DownloadButton.types'
import { DownloadButtonLabelContainer, DownloadButtonStyled } from './DownloadButton.styled'

const DownloadButton = React.memo((props: DownloadButtonProps) => {
  const { href, onClick, label, subLabel, place, event, isFullWidth, startIcon, endIcon, isLoading } = props
  return (
    <DownloadButtonStyled
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
        <DownloadButtonLabelContainer>
          {label}
          {subLabel && <span>{subLabel}</span>}
        </DownloadButtonLabelContainer>
      )}
    </DownloadButtonStyled>
  )
})

export { DownloadButton }
