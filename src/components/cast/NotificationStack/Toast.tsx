import { ReactNode, createContext, useContext } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { ActionButton, CloseButton, Message, TextBlock, Title, Toast as ToastBox, TopRow } from './NotificationStack.styled'

interface ToastContextValue {
  id: string
  onDismiss: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('Toast subcomponents must be used inside <Toast.Root>')
  }
  return ctx
}

function Root({ id, onDismiss, children }: { id: string; onDismiss: () => void; children: ReactNode }) {
  return (
    <ToastContext.Provider value={{ id, onDismiss }}>
      <ToastBox data-testid={`notification-${id}`} role="status" aria-live="polite" aria-atomic="true">
        {children}
      </ToastBox>
    </ToastContext.Provider>
  )
}

function Header({ children }: { children: ReactNode }) {
  return <TopRow>{children}</TopRow>
}

function Body({ children }: { children: ReactNode }) {
  return <TextBlock>{children}</TextBlock>
}

function ToastTitle({ children }: { children: ReactNode }) {
  return <Title>{children}</Title>
}

function ToastMessage({ children }: { children: ReactNode }) {
  return <Message data-testid="notification-message">{children}</Message>
}

function DismissButton() {
  const { onDismiss } = useToast()
  const { t } = useCastTranslation()
  return (
    <CloseButton aria-label={t('notifications.dismiss')} onClick={onDismiss}>
      <CloseIcon />
    </CloseButton>
  )
}

// Any action button auto-dismisses the toast after firing — losing a Retry
// to a stale toast that stayed on screen would be a UX bug, not a feature.
function Action({ label, onClick }: { label: string; onClick: () => void }) {
  const { onDismiss } = useToast()
  return (
    <ActionButton
      onClick={() => {
        onClick()
        onDismiss()
      }}
    >
      {label}
    </ActionButton>
  )
}

const Toast = {
  Root,
  Header,
  Body,
  Title: ToastTitle,
  Message: ToastMessage,
  DismissButton,
  Action
}

export { Toast }
