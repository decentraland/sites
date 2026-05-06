import { ErrorModalProps } from './ErrorModal.types'
import { ExitButton, Message, Modal, Overlay, Title } from './ErrorModal.styled'

export function ErrorModal({ title, message, onExit, showExitButton = true, exitButtonText = 'EXIT' }: ErrorModalProps) {
  const handleExit = () => {
    if (onExit) {
      onExit()
    }
  }

  return (
    <Overlay>
      <Modal>
        <Title>{title}</Title>
        <Message>{message}</Message>
        {showExitButton && (
          <ExitButton variant="contained" color="error" onClick={handleExit}>
            {exitButtonText}
          </ExitButton>
        )}
      </Modal>
    </Overlay>
  )
}
