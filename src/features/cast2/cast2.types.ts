interface LiveKitCredentials {
  url: string
  token: string
  roomName?: string
  identity: string
  roomId: string
  placeName?: string
}

interface StreamInfo {
  placeName: string
  placeId: string
  location: string
  isWorld: boolean
}

interface WorldSceneEntity {
  id: string
  type: string
  timestamp: number
  pointers: string[]
  metadata?: {
    display?: {
      title?: string
    }
    scene?: {
      base?: string
      parcels?: string[]
    }
  }
}

interface WorldScene {
  worldName: string
  entityId: string
  entity: WorldSceneEntity
  parcels: string[]
}

interface WorldScenesResponse {
  scenes: WorldScene[]
  total: number
}

interface PresentationBotToken {
  url: string
  token: string
  roomId: string
}

interface PresentationInfo {
  id: string
  slideCount: number
  currentSlide: number
  fileType: 'pdf' | 'pptx'
}

interface SlideVideoInfo {
  url: string
  geometry: { x: number; y: number; width: number; height: number }
}

interface AnonymousIdentity {
  id: string
  name: string
  avatar: string
}

interface TokenPayload {
  identity: string
  roomId: string
  permissions: {
    canPublish: boolean
    canSubscribe: boolean
    canPublishData: boolean
  }
}

interface CastMessage {
  type: 'chat' | 'ping' | 'pong' | 'emote'
  timestamp: number
  message: string
  from?: string
}

enum CastRoomType {
  WORLD = 'world',
  COMMUNITY = 'community',
  GENESIS = 'genesis'
}

class CastApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'CastApiError'
  }
}

export { CastApiError, CastRoomType }
export type {
  AnonymousIdentity,
  CastMessage,
  LiveKitCredentials,
  PresentationBotToken,
  PresentationInfo,
  SlideVideoInfo,
  StreamInfo,
  TokenPayload,
  WorldScene,
  WorldSceneEntity,
  WorldScenesResponse
}
