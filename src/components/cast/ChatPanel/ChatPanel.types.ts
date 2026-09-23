import { ReceivedChatMessage } from '../../../hooks/useChat'

interface ChatPanelProps {
  onClose?: () => void
  chatMessages: ReceivedChatMessage[]
  onMessagesRead?: () => void
  // Overrides for embeds outside a cast stream (e.g. the /places scene
  // detail), where there's no streamMetadata to derive the footer scene link
  // from.
  sceneName?: string
  jumpHref?: string
}

export type { ChatPanelProps }
