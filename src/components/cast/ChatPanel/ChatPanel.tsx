/* eslint-disable @typescript-eslint/naming-convention */
import { useEffect, useRef, useState } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import { Typography } from 'decentraland-ui2'
import { useChatContext } from '../../../features/cast2/contexts/ChatProvider'
import { useLiveKitCredentials } from '../../../features/cast2/contexts/LiveKitContext'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { ReceivedChatMessage } from '../../../hooks/useChat'
import { getDisplayName } from '../../../utils/avatarColor'
import { Avatar } from '../Avatar/Avatar'
import { ChatPanelProps } from './ChatPanel.types'
import {
  ChatContainer,
  ChatFooter,
  ChatHeader,
  ChatInputContainer,
  ChatInputSection,
  ChatMessage,
  ChatMessages,
  CloseButton,
  EmptyChat,
  FooterLink,
  MessageContent,
  MessageHeader,
  MessageTime,
  ParticipantName,
  SendButton,
  StyledInput
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
  const { hasValidIdentity } = useAuthIdentity()

  // Mark messages as read when panel opens
  useEffect(() => {
    if (onMessagesRead) {
      onMessagesRead()
    }
  }, [onMessagesRead])

  // Get profiles + send capability from context (already wired to the room)
  const { profiles, sendMessage, isSending } = useChatContext()
  const [draft, setDraft] = useState('')

  const handleSend = async () => {
    const trimmed = draft.trim()
    if (!trimmed || isSending) return
    setDraft('')
    await sendMessage(trimmed)
  }

  // Generate jump link based on stream metadata
  const jumpLink = streamMetadata
    ? streamMetadata.isWorld
      ? `https://decentraland.org/jump/?realm=${streamMetadata.location}`
      : `https://decentraland.org/jump/?position=${encodeURIComponent(streamMetadata.location)}`
    : null

  const sceneName = streamMetadata?.placeName || 'this scene'

  const renderMessage = (msg: ReceivedChatMessage, index: number) => {
    // participantName is the raw LiveKit identity. For scene comms it's the
    // wallet (`0x…`) and we resolve a display name via the catalyst profile.
    // For non-wallet identities (cast watchers' anonymous strings, in-world
    // clients that publish a pre-formatted displayName) we just show the
    // raw identifier — never re-format it, or we get double `#suffix`es.
    const address = msg.participantName ?? ''
    const isWalletAddress = address.startsWith('0x')
    const lowerAddress = isWalletAddress ? address.toLowerCase() : ''
    const profile = isWalletAddress ? profiles.get(lowerAddress) : null

    // Wallet display priority:
    //   1. claimed name → "Alice"
    //   2. deployed profile with name → "alice#a1b2"
    //   3. profile loaded but empty → "0x12…ab"
    //   4. profile still in flight → "…" (avoids address→name flicker)
    // Non-wallet identities (cast watchers, etc.) render raw.
    let displayName: string
    if (!isWalletAddress) {
      displayName = address || 'Anonymous'
    } else {
      const fromProfile = getDisplayName({ name: profile?.name, hasClaimedName: profile?.hasClaimedName, ethAddress: address })
      const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`
      displayName = fromProfile || (profiles.has(lowerAddress) ? shortAddress : '…')
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

  // Auto-scroll to bottom when new messages arrive. `block: 'nearest'`
  // confines the scroll to the ChatMessages overflow container — without it
  // the page itself scrolls on every new message when ChatPanel is embedded
  // (see /discover/place/* scene detail) because scrollIntoView walks up to
  // every scrollable ancestor by default.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
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

      {hasValidIdentity ? (
        <ChatInputSection>
          <ChatInputContainer>
            <StyledInput
              placeholder={t('chat.type_message')}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              disabled={isSending}
              fullWidth
            />
            <SendButton variant="outlined" onClick={handleSend} disabled={isSending || draft.trim().length === 0}>
              <SendIcon />
            </SendButton>
          </ChatInputContainer>
        </ChatInputSection>
      ) : (
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
      )}
    </ChatContainer>
  )
}
