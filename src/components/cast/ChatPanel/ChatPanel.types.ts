import { ReceivedChatMessage } from '../../../hooks/useChat'

interface ChatPanelProps {
  onClose?: () => void
  chatMessages: ReceivedChatMessage[]
  onMessagesRead?: () => void
}

export type { ChatPanelProps }
