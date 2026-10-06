import type { Participant } from 'livekit-client'
import {
  type DeviceSettings,
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
} from './cast2.utils'

const RETRYABLE_CODES = [
  'video-timeout',
  'video-server-error',
  'video-playback-interrupted',
  'video-stream-error',
  'audio-processing-failed'
]
const FINAL_CODES = ['video-not-found', 'video-permission-denied', 'video-invalid-format', 'unknown']
const participant = (identity: string, metadata: string | undefined) => ({ identity, metadata }) as Participant
const SETTINGS: DeviceSettings = { audioInputId: 'mic-1', audioOutputId: 'speaker-1', videoDeviceId: 'cam-1' }

describe.each<[string, () => void, () => unknown, () => void, unknown]>([
  ['the streamer token', () => saveStreamerToken('stream-token'), getStreamerToken, clearStreamerToken, 'stream-token'],
  ['the device settings', () => saveDeviceSettings(SETTINGS), getDeviceSettings, clearDeviceSettings, SETTINGS]
])('when persisting %s', (_label, save, read, clear, expected) => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and nothing was saved', () => {
    it('should read back nothing', () => {
      expect(read()).toBeNull()
    })
  })

  describe('and it was saved', () => {
    beforeEach(() => {
      save()
    })

    it('should read back the saved value', () => {
      expect(read()).toEqual(expected)
    })

    describe('and it was cleared', () => {
      beforeEach(() => {
        clear()
      })

      it('should read back nothing', () => {
        expect(read()).toBeNull()
      })
    })
  })
})

describe.each<[string, () => unknown, string]>([
  ['saving the streamer token', () => saveStreamerToken('stream-token'), 'Failed to save streamer token'],
  ['reading the streamer token', getStreamerToken, 'Failed to read streamer token'],
  ['clearing the streamer token', clearStreamerToken, 'Failed to clear streamer token'],
  ['saving the device settings', () => saveDeviceSettings(SETTINGS), 'Failed to save device settings'],
  ['reading the device settings', getDeviceSettings, 'Failed to read device settings'],
  ['clearing the device settings', clearDeviceSettings, 'Failed to clear device settings']
])('when %s and storage throws', (_label, action, message) => {
  let consoleError: jest.SpyInstance
  let result: unknown

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('denied')
    })
    result = action()
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it('should log the failure', () => {
    expect(consoleError).toHaveBeenCalledWith(`[cast2/localStorage] ${message}`, expect.any(Error))
  })

  it('should return no value', () => {
    expect(result ?? null).toBeNull()
  })
})

describe('when the stored device settings are not valid JSON', () => {
  let consoleError: jest.SpyInstance
  let settings: DeviceSettings | null

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    localStorage.setItem('dcl_cast_device_settings', '{not json')
    settings = getDeviceSettings()
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it('should read back no settings', () => {
    expect(settings).toBeNull()
  })

  it('should log the failure', () => {
    expect(consoleError).toHaveBeenCalledWith('[cast2/localStorage] Failed to read device settings', expect.any(Error))
  })
})

describe.each<[string, () => unknown, unknown]>([
  ['isPresentationBot with a presentation-bot identity', () => isPresentationBot({ identity: 'presentation-bot:room:uuid' }), true],
  ['isPresentationBot with a streamer identity', () => isPresentationBot({ identity: 'stream:place:uuid' }), false],
  ['isPresentationBot with an empty identity', () => isPresentationBot({ identity: '' }), false],
  [
    'isRetryableVideoErrorCode with the retryable codes',
    () => RETRYABLE_CODES.map(isRetryableVideoErrorCode),
    RETRYABLE_CODES.map(() => true)
  ],
  ['isRetryableVideoErrorCode with other codes', () => FINAL_CODES.map(isRetryableVideoErrorCode), FINAL_CODES.map(() => false)],
  [
    'parseParticipantMetadata with valid JSON',
    () => parseParticipantMetadata({ metadata: '{"role":"presentation"}' }),
    { role: 'presentation' }
  ],
  ['parseParticipantMetadata with empty metadata', () => parseParticipantMetadata({ metadata: '' }), null],
  ['parseParticipantMetadata with invalid JSON', () => parseParticipantMetadata({ metadata: '{bad' }), null],
  ['getDisplayName with a displayName in the metadata', () => getDisplayName(participant('0xabc', '{"displayName":"Alice"}')), 'Alice'],
  ['getDisplayName without a displayName in the metadata', () => getDisplayName(participant('0xabc', '{"role":"streamer"}')), '0xabc'],
  ['getDisplayName with invalid JSON metadata', () => getDisplayName(participant('0xabc', '{bad')), '0xabc'],
  ['getDisplayName without metadata nor identity', () => getDisplayName(participant('', undefined)), 'Anonymous']
])('when calling %s', (_label, call, expected) => {
  let result: unknown

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    result = call()
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it(`should return ${JSON.stringify(expected)}`, () => {
    expect(result).toEqual(expected)
  })
})

describe.each([
  ['lowest', 0, 'happy-rabbit'],
  ['highest', 0.9999, 'ancient-octopus']
])('when generating a random name and the random source returns its %s value', (_label, random, expected) => {
  let name: string

  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(random)
    name = generateRandomName()
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it(`should return ${expected}`, () => {
    expect(name).toBe(expected)
  })
})

describe.each<[string, () => unknown, unknown]>([
  ['a LiveKit identity', () => createLiveKitIdentity('room-2'), expect.stringMatching(/^anon:room-2:\d+-[a-z0-9]+$/)],
  [
    'an anonymous identity',
    () => generateAnonymousIdentity('room-1'),
    {
      id: expect.stringMatching(/^anon:room-1:\d+-[a-z0-9]+$/),
      name: expect.stringMatching(/^[a-z]+-[a-z]+$/),
      avatar: expect.stringMatching(/^#[0-9A-F]{6}$/)
    }
  ]
])('when generating %s', (_label, generate, expected) => {
  let identity: unknown

  beforeEach(() => {
    identity = generate()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should scope it to the room with an anon prefix', () => {
    expect(identity).toEqual(expected)
  })
})
