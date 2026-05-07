/* eslint-disable @typescript-eslint/naming-convention */
import { type ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useChat } from '../../../../hooks/useChat'
import type { ReceivedChatMessage } from '../../../../hooks/useChat'
import { useProfiles } from '../../../../hooks/useProfiles'

interface ChatContextValue {
  chatMessages: ReceivedChatMessage[]
  unreadMessagesCount: number
  markMessagesAsRead: () => void
  isChatOpen: boolean
  setChatOpen: (open: boolean) => void
  profiles: ReturnType<typeof useProfiles>['profiles']
}

const ChatContext = createContext<ChatContextValue | null>(null)

const useChatContext = (): ChatContextValue => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider')
  }
  return context
}

const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { chatMessages } = useChat()
  const [lastReadMessageIndex, setLastReadMessageIndex] = useState(0)
  const [isChatOpen, setChatOpen] = useState(false)

  const addresses = useMemo(() => {
    const set = new Set<string>()
    chatMessages.forEach(msg => {
      const address = msg.participantName
      if (address && address.startsWith('0x')) set.add(address)
    })
    return Array.from(set)
  }, [chatMessages])

  const { profiles } = useProfiles(addresses)

  const markMessagesAsRead = useCallback(() => {
    setLastReadMessageIndex(chatMessages.length)
  }, [chatMessages.length])

  const unreadMessagesCount = isChatOpen ? 0 : Math.max(0, chatMessages.length - lastReadMessageIndex)

  const value = useMemo<ChatContextValue>(
    () => ({ chatMessages, unreadMessagesCount, markMessagesAsRead, isChatOpen, setChatOpen, profiles }),
    [chatMessages, unreadMessagesCount, markMessagesAsRead, isChatOpen, profiles]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export { ChatProvider, useChatContext }
