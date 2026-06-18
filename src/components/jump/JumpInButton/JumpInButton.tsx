import { type FC, type ReactNode } from 'react'
import { type ButtonProps, DownloadModal, JumpInIcon } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useLaunchExplorer } from '../../../hooks/useLaunchExplorer'
import { JumpInIconButton, StyledJumpInButton } from './JumpInButton.styled'

interface JumpInButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  position: string
  realm?: string
  onlyIcon?: boolean
  children?: ReactNode
}

const JumpInButton: FC<JumpInButtonProps> = ({
  position,
  realm,
  onlyIcon = false,
  size = 'large',
  children,
  fullWidth,
  sx,
  color = 'primary',
  variant = 'contained'
}) => {
  const formatMessage = useFormatMessage()
  const { launchExplorer, isMobile, isDownloadModalOpen, closeDownloadModal, downloadModalProps } = useLaunchExplorer({
    position,
    realm
  })

  const renderButton = () => {
    if (onlyIcon) {
      return (
        <JumpInIconButton onClick={launchExplorer} aria-label={formatMessage('component.jump.jump_in_button.jump_in')} sx={sx}>
          <JumpInIcon />
        </JumpInIconButton>
      )
    }
    return (
      <StyledJumpInButton
        variant={variant}
        color={color}
        size={size}
        fullWidth={fullWidth}
        sx={sx}
        endIcon={<JumpInIcon />}
        onClick={launchExplorer}
      >
        {children ?? formatMessage('component.jump.jump_in_button.jump_in')}
      </StyledJumpInButton>
    )
  }

  return (
    <>
      {renderButton()}
      {!isMobile && <DownloadModal open={isDownloadModalOpen} onClose={closeDownloadModal} {...downloadModalProps} />}
    </>
  )
}

export { JumpInButton }
export type { JumpInButtonProps }
