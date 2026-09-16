/* eslint-disable @typescript-eslint/naming-convention */
import { useEffect, useRef } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import { Typography } from 'decentraland-ui2'
import { useChatContext } from '../../../features/cast2/contexts/ChatProvider'
import { useLiveKitCredentials } from '../../../features/cast2/contexts/LiveKitContext'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { ReceivedChatMessage } from '../../../hooks/useChat'
import { getDisplayName } from '../../../utils/avatarColor'
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

export function ChatPanel(props: ChatPanelProps) {
  const { onClose, chatMessages, onMessagesRead, sceneName: sceneNameProp, jumpHref } = props
  const { t } = useCastTranslation()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { streamMetadata } = useLiveKitCredentials()

  // Mark messages as read when panel opens
  useEffect(() => {
    if (onMessagesRead) {
      onMessagesRead()
    }
  }, [onMessagesRead])

  // Get profiles from context (already wired to the room)
  const { profiles } = useChatContext()

  // Generate jump link based on stream metadata, unless the embedding page
  // supplies its own (the discover scene page passes the decentraland:// deep-link).
  const jumpLink =
    jumpHref ??
    (streamMetadata
      ? streamMetadata.isWorld
        ? `https://decentraland.org/jump/?realm=${streamMetadata.location}`
        : `https://decentraland.org/jump/?position=${encodeURIComponent(streamMetadata.location)}`
      : null)

  const sceneName = sceneNameProp || streamMetadata?.placeName || 'this scene'

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
  // (see /places/place/* scene detail) because scrollIntoView walks up to
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

      {/* NOTE: the chat is intentionally read-only in the browser — viewers are
          not in the scene comms as chat participants, so there is no send input
          on any surface (cast or discover). The footer deep-links them into the
          client to participate. */}
      <ChatFooter>
        {jumpLink ? (
          <Typography variant="body2">
            {t('chat.footer_jump_prefix')}{' '}
            <FooterLink href={jumpLink} target="_blank" rel="noopener noreferrer">
              {sceneName}
            </FooterLink>{' '}
            {t('chat.footer_jump_suffix')}
          </Typography>
        ) : (
          <Typography variant="body2">{t('chat.footer_text', { sceneName })}</Typography>
        )}
      </ChatFooter>
    </ChatContainer>
  )
}
