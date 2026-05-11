export interface ErrorModalProps {
  title: string
  message: string
  onExit?: () => void
  showExitButton?: boolean
  exitButtonText?: string
}
