import { useEffect, useState } from 'react'
import { useRoomContext } from '@livekit/components-react'
import { Participant, RoomEvent } from 'livekit-client'
import { Packet } from '@dcl/protocol/out-js/decentraland/kernel/comms/rfc4/comms.gen'
import { getDisplayName } from '../features/cast2/cast2.utils'

interface ReceivedChatMessage {
  from: Participant | undefined
  timestamp: number
  message: string
  participantName?: string
  participantColor?: string
}

const getParticipantColor = (identity?: string): string => {
  if (!identity) return '#666666'
  let hash = 0
  for (let i = 0; i < identity.length; i++) {
    hash = identity.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 50%)`
}

const useChat = () => {
  const room = useRoomContext()
  const [chatMessages, setChatMessages] = useState<ReceivedChatMessage[]>([])
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (!room) return
    const messages: ReceivedChatMessage[] = []
    const handleDataReceived = (payload: Uint8Array, participant?: Participant) => {
      try {
        const packet = Packet.decode(payload)
        if (
          packet.message?.$case === 'chat' &&
          !packet.message.chat.message.startsWith('␆') &&
          !packet.message.chat.message.startsWith('␑') &&
          !packet.message.chat.message.startsWith('␐')
        ) {
          const { timestamp, message } = packet.message.chat
          const newMessage: ReceivedChatMessage = {
            from: participant,
            timestamp,
            message,
            participantName: participant ? getDisplayName(participant) : 'Unknown',
            participantColor: getParticipantColor(participant?.identity)
          }
          messages.push(newMessage)
          setChatMessages([...messages])
        }
      } catch (error) {
        console.error('[useChat] Failed to decode protocol message:', error)
      }
    }
    room.on(RoomEvent.DataReceived, handleDataReceived)
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived)
    }
  }, [room])

  const sendMessage = async (message: string) => {
    if (!room || !room.localParticipant || isSending) return
    const encodedMsg = Packet.encode({
      protocolVersion: 0,
      message: {
        $case: 'chat',
        chat: { timestamp: Date.now(), message: message.trim() }
      }
    }).finish()
    setIsSending(true)
    try {
      await room.localParticipant.publishData(encodedMsg, { reliable: true, destinationIdentities: [] })
      const ourMessage: ReceivedChatMessage = {
        from: room.localParticipant,
        timestamp: Date.now(),
        message: message.trim(),
        participantName: getDisplayName(room.localParticipant),
        participantColor: getParticipantColor(room.localParticipant.identity)
      }
      setChatMessages(prev => [...prev, ourMessage])
    } catch (error) {
      console.error('[useChat] Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  return { chatMessages, sendMessage, isSending }
}

export type { ReceivedChatMessage }
export { useChat }
