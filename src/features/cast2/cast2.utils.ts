import type { Participant } from 'livekit-client'
import type { AnonymousIdentity } from './cast2.types'

const STREAMER_TOKEN_KEY = 'dcl_cast_streamer_token'
const DEVICE_SETTINGS_KEY = 'dcl_cast_device_settings'

interface DeviceSettings {
  audioInputId?: string
  audioOutputId?: string
  videoDeviceId?: string
}

const saveStreamerToken = (token: string): void => {
  try {
    localStorage.setItem(STREAMER_TOKEN_KEY, token)
  } catch (error) {
    console.error('[cast2/localStorage] Failed to save streamer token', error)
  }
}

const getStreamerToken = (): string | null => {
  try {
    return localStorage.getItem(STREAMER_TOKEN_KEY)
  } catch (error) {
    console.error('[cast2/localStorage] Failed to read streamer token', error)
    return null
  }
}

const clearStreamerToken = (): void => {
  try {
    localStorage.removeItem(STREAMER_TOKEN_KEY)
  } catch (error) {
    console.error('[cast2/localStorage] Failed to clear streamer token', error)
  }
}

const saveDeviceSettings = (settings: DeviceSettings): void => {
  try {
    localStorage.setItem(DEVICE_SETTINGS_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('[cast2/localStorage] Failed to save device settings', error)
  }
}

const getDeviceSettings = (): DeviceSettings | null => {
  try {
    const raw = localStorage.getItem(DEVICE_SETTINGS_KEY)
    return raw ? (JSON.parse(raw) as DeviceSettings) : null
  } catch (error) {
    console.error('[cast2/localStorage] Failed to read device settings', error)
    return null
  }
}

const clearDeviceSettings = (): void => {
  try {
    localStorage.removeItem(DEVICE_SETTINGS_KEY)
  } catch (error) {
    console.error('[cast2/localStorage] Failed to clear device settings', error)
  }
}

const AVATAR_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43']

const ANON_ADJECTIVES = [
  'happy',
  'brave',
  'clever',
  'bright',
  'swift',
  'gentle',
  'mighty',
  'calm',
  'wise',
  'bold',
  'eager',
  'noble',
  'proud',
  'quiet',
  'agile',
  'fancy',
  'jolly',
  'keen',
  'lively',
  'merry',
  'sharp',
  'warm',
  'wild',
  'cosmic',
  'crystal',
  'golden',
  'silver',
  'royal',
  'mystic',
  'ancient'
]

const ANON_NOUNS = [
  'rabbit',
  'falcon',
  'dolphin',
  'tiger',
  'phoenix',
  'dragon',
  'wolf',
  'eagle',
  'panda',
  'lion',
  'fox',
  'hawk',
  'owl',
  'bear',
  'deer',
  'raven',
  'snake',
  'shark',
  'whale',
  'panther',
  'jaguar',
  'cheetah',
  'lynx',
  'otter',
  'beaver',
  'badger',
  'koala',
  'sloth',
  'penguin',
  'octopus'
]

const generateRandomName = (): string => {
  const adjective = ANON_ADJECTIVES[Math.floor(Math.random() * ANON_ADJECTIVES.length)]
  const noun = ANON_NOUNS[Math.floor(Math.random() * ANON_NOUNS.length)]
  return `${adjective}-${noun}`
}

const generateAnonymousIdentity = (roomId: string): AnonymousIdentity => {
  const randomId = Math.random().toString(36).substring(2, 15)
  const ulid = `${Date.now()}-${randomId}`
  return {
    id: `anon:${roomId}:${ulid}`,
    name: generateRandomName(),
    avatar: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
  }
}

const createLiveKitIdentity = (roomId: string): string => generateAnonymousIdentity(roomId).id

const getDisplayName = (participant: Participant): string => {
  try {
    const metadata = participant.metadata ? JSON.parse(participant.metadata) : null
    if (metadata?.displayName) return metadata.displayName as string
  } catch (error) {
    console.warn('[cast2/getDisplayName] Failed to parse metadata', error)
  }
  return participant.identity || 'Anonymous'
}

const parseParticipantMetadata = <T = Record<string, unknown>>(participant: Pick<Participant, 'metadata'>): T | null => {
  try {
    return participant.metadata ? (JSON.parse(participant.metadata) as T) : null
  } catch {
    return null
  }
}

const isPresentationBot = (participant: Pick<Participant, 'metadata'>): boolean => {
  const metadata = parseParticipantMetadata<{ role?: string }>(participant)
  return metadata?.role === 'presentation'
}

type VideoErrorCode =
  | 'video-quota-exceeded'
  | 'video-permission-denied'
  | 'video-not-found'
  | 'video-server-error'
  | 'video-timeout'
  | 'video-too-large'
  | 'video-too-many-redirects'
  | 'video-invalid-format'
  | 'video-playback-failed'
  | 'video-playback-interrupted'
  | 'video-stream-error'
  | 'audio-processing-failed'

const RETRYABLE_VIDEO_ERROR_CODES = new Set<string>([
  'video-timeout',
  'video-server-error',
  'video-playback-interrupted',
  'video-stream-error',
  'audio-processing-failed'
])

const isRetryableVideoErrorCode = (code: string): boolean => RETRYABLE_VIDEO_ERROR_CODES.has(code)

export {
  clearDeviceSettings,
  clearStreamerToken,
  createLiveKitIdentity,
  generateAnonymousIdentity,
  generateRandomName,
  getDeviceSettings,
  getDisplayName,
  getStreamerToken,
  isPresentationBot,
  isRetryableVideoErrorCode,
  parseParticipantMetadata,
  saveDeviceSettings,
  saveStreamerToken
}
export type { DeviceSettings, VideoErrorCode }
