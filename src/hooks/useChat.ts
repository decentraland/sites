import { useEffect, useState } from 'react'
import { useRoomContext } from '@livekit/components-react'
import { Participant, RoomEvent } from 'livekit-client'
import { Packet } from '@dcl/protocol/out-js/decentraland/kernel/comms/rfc4/comms.gen'

interface ReceivedChatMessage {
  from: Participant | undefined
  timestamp: number
  message: string
  participantName?: string
}

// Control-symbol prefixes (␆ U+2406, ␑ U+2411, ␐ U+2410) are reserved for
// non-chat scene-comms signaling — bevy/godot use them to mux presence +
// private messaging through the same data channel. Messages starting with
// any of these are skipped silently.
const CONTROL_PREFIXES = ['␆', '␑', '␐']

// Resolves the value carried on the chat message as `participantName`.
// Two cases:
//   1. Scene comms (DCL world / Genesis City) — `identity` is the wallet
//      address. We keep it raw so the ChatPanel can resolve a real name
//      via the catalyst profile. Using `metadata.displayName` here would
//      bypass that lookup and risk double-formatting (the gatekeeper can
//      publish "Name#abcd" already suffixed).
//   2. Cast streaming — `identity` is an anonymous string (`anon:<id>`)
//      and the friendly handle lives in `metadata.displayName`. We surface
//      that so anonymous watchers don't show as raw `anon:` IDs.
function resolveParticipantName(participant: Participant | undefined): string {
  const identity = participant?.identity
  if (!identity) return 'Unknown'
  if (identity.startsWith('0x')) return identity
  try {
    const metadata = participant?.metadata ? JSON.parse(participant.metadata) : null
    if (metadata?.displayName) return metadata.displayName as string
  } catch {
    /* fall through to identity */
  }
  return identity || 'Anonymous'
}

const useChat = () => {
  const room = useRoomContext()
  const [chatMessages, setChatMessages] = useState<ReceivedChatMessage[]>([])
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (!room) return
    const handleDataReceived = (payload: Uint8Array, participant?: Participant) => {
      try {
        const packet = Packet.decode(payload)
        if (packet.message?.$case !== 'chat') return
        const { message } = packet.message.chat
        if (CONTROL_PREFIXES.some(prefix => message.startsWith(prefix))) return
        // The proto `chat.timestamp` is seconds-since-some-local-epoch
        // (`performance.now()/1000` for our publishes, `time.elapsed_secs`
        // for bevy/godot publishes) — useful for the wire-level duplicate
        // filter on receivers, but NOT a unix timestamp. We render with
        // wall-clock `Date.now()` so `formatTime` in ChatPanel doesn't
        // show every in-world peer's row as `1970`.
        // Functional setState so locally-sent messages (appended by
        // sendMessage) survive subsequent inbound messages. The previous
        // closure-scoped accumulator dropped outbound messages on the next
        // received-event.
        setChatMessages(prev => [
          ...prev,
          { from: participant, timestamp: Date.now(), message, participantName: resolveParticipantName(participant) }
        ])
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
    const trimmed = message.trim()
    // DCL scene comms (RFC-4) wire format:
    //   - `protocolVersion: 100` — matches what bevy-explorer / unity-explorer
    //     publish. The version-0 default makes in-world clients silently drop
    //     the packet (they don't fall back to legacy on unknown versions).
    //   - `timestamp` is a proto `float` (32-bit). `Date.now()` (~1.7e12) has
    //     only ~64s of effective resolution at that magnitude, so two messages
    //     <60s apart collapse to the same float and the receivers' per-sender
    //     duplicate filter (`if last < chat.timestamp`) drops the second one.
    //     `performance.now() / 1000` is small + monotonic — ms-level precision
    //     stays intact across a full session.
    const encodedMsg = Packet.encode({
      protocolVersion: 100,
      message: { $case: 'chat', chat: { timestamp: performance.now() / 1000, message: trimmed } }
    }).finish()
    setIsSending(true)
    // Optimistically render our own message immediately so the local UI feels
    // responsive — the send happens in parallel. If the publish later fails
    // the error is logged loudly; we leave the local row in place rather than
    // yank it (matches how Slack / Discord behave when send is in-flight).
    setChatMessages(prev => [
      ...prev,
      {
        from: room.localParticipant,
        timestamp: Date.now(),
        message: trimmed,
        participantName: resolveParticipantName(room.localParticipant)
      }
    ])
    try {
      await room.localParticipant.publishData(encodedMsg, { reliable: true, destinationIdentities: [] })
    } catch (error) {
      console.error('[useChat] publishData failed — message will not reach other participants:', error)
    } finally {
      setIsSending(false)
    }
  }

  return { chatMessages, sendMessage, isSending }
}

export type { ReceivedChatMessage }
export { useChat }
