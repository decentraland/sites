/* eslint-disable @typescript-eslint/naming-convention */
import { useEffect, useRef } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import { Typography } from 'decentraland-ui2'
import { useChatContext } from '../../../features/cast2/contexts/ChatProvider'
import { useLiveKitCredentials } from '../../../features/cast2/contexts/LiveKitContext'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { ReceivedChatMessage } from '../../../hooks/useChat'
import { Avatar } from '../Avatar/Avatar'
import { ChatPanelProps } from './ChatPanel.types'
import {
  ChatContainer,
  ChatFooter,
  ChatHeader,
  ChatMessage,
  ChatMessages,
  CloseButton,
  EmptyChat,
  FooterLink,
  MessageContent,
  MessageHeader,
  MessageTime,
  ParticipantName
} from './ChatPanel.styled'

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function ChatPanel({ onClose, chatMessages, onMessagesRead }: ChatPanelProps) {
  const { t } = useCastTranslation()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { streamMetadata } = useLiveKitCredentials()

  // Mark messages as read when panel opens
  useEffect(() => {
    if (onMessagesRead) {
      onMessagesRead()
    }
  }, [onMessagesRead])

  // Get profiles from context (already prefetched)
  const { profiles } = useChatContext()

  // Generate jump link based on stream metadata
  const jumpLink = streamMetadata
    ? streamMetadata.isWorld
      ? `https://decentraland.org/jump/?realm=${streamMetadata.location}`
      : `https://decentraland.org/jump/?position=${encodeURIComponent(streamMetadata.location)}`
    : null

  const sceneName = streamMetadata?.placeName || 'this scene'

  const renderMessage = (msg: ReceivedChatMessage, index: number) => {
    // participantName contains the address
    const address = msg.participantName
    const profile = address?.startsWith('0x') ? profiles.get(address.toLowerCase()) : null

    // Display name: claimed name > truncated address > Unknown
    let displayName = 'Unknown'
    if (profile?.hasClaimedName && profile?.name) {
      displayName = profile.name
    } else if (address?.startsWith('0x')) {
      // Truncate address: 0x1234...5678
      displayName = `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    return (
      <ChatMessage key={index}>
        <MessageHeader>
          <Avatar profile={profile} address={address} size={26} />
          <ParticipantName>{displayName}</ParticipantName>
          <MessageTime>{formatTime(msg.timestamp)}</MessageTime>
        </MessageHeader>
        <MessageContent>{msg.message}</MessageContent>
      </ChatMessage>
    )
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  return (
    <ChatContainer>
      <ChatHeader>
        <Typography variant="h6">{t('chat.title')}</Typography>
        {onClose && (
          <CloseButton onClick={onClose}>
            <CloseIcon />
          </CloseButton>
        )}
      </ChatHeader>

      <ChatMessages>
        {chatMessages.length === 0 ? (
          <EmptyChat>
            <Typography variant="body2">{t('chat.no_messages_yet')}</Typography>
          </EmptyChat>
        ) : (
          <>
            {chatMessages.map((msg, index) => renderMessage(msg, index))}
            <div ref={messagesEndRef} />
          </>
        )}
      </ChatMessages>

      <ChatFooter>
        {jumpLink ? (
          <Typography variant="body2">
            Jump into{' '}
            <FooterLink href={jumpLink} target="_blank" rel="noopener noreferrer">
              {sceneName}
            </FooterLink>{' '}
            in Decentraland to participate in the chat.
          </Typography>
        ) : (
          <Typography variant="body2">{t('chat.footer_text', { sceneName })}</Typography>
        )}
      </ChatFooter>
    </ChatContainer>
  )
}
