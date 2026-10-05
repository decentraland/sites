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

describe('when checking isPresentationBot', () => {
  let participant: Pick<Participant, 'identity' | 'metadata'>

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the identity carries the presentation-bot prefix', () => {
    beforeEach(() => {
      participant = { identity: 'presentation-bot:room:uuid', metadata: undefined }
    })

    it('should recognise the participant as the presentation bot', () => {
      expect(isPresentationBot(participant)).toBe(true)
    })
  })

  describe('and a streamer identity claims the presentation role in its metadata', () => {
    beforeEach(() => {
      participant = { identity: 'stream:place:uuid', metadata: JSON.stringify({ role: 'presentation' }) }
    })

    it('should not recognise the participant as the presentation bot', () => {
      expect(isPresentationBot(participant)).toBe(false)
    })
  })

  describe('and the identity is empty', () => {
    beforeEach(() => {
      participant = { identity: '', metadata: undefined }
    })

    it('should not recognise the participant as the presentation bot', () => {
      expect(isPresentationBot(participant)).toBe(false)
    })
  })
})

describe('when persisting the streamer token', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  describe('and storage is available', () => {
    beforeEach(() => {
      saveStreamerToken('stream-token')
    })

    it('should read back the saved token', () => {
      expect(getStreamerToken()).toBe('stream-token')
    })

    describe('and the token is cleared', () => {
      beforeEach(() => {
        clearStreamerToken()
      })

      it('should read back no token', () => {
        expect(getStreamerToken()).toBeNull()
      })
    })
  })

  describe('and storage throws', () => {
    let consoleError: jest.SpyInstance

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
    })

    it('should log instead of throwing when saving', () => {
      expect(() => saveStreamerToken('stream-token')).not.toThrow()
      expect(consoleError).toHaveBeenCalledWith('[cast2/localStorage] Failed to save streamer token', expect.any(Error))
    })

    it('should return null when reading', () => {
      expect(getStreamerToken()).toBeNull()
      expect(consoleError).toHaveBeenCalledWith('[cast2/localStorage] Failed to read streamer token', expect.any(Error))
    })

    it('should log instead of throwing when clearing', () => {
      expect(() => clearStreamerToken()).not.toThrow()
      expect(consoleError).toHaveBeenCalledWith('[cast2/localStorage] Failed to clear streamer token', expect.any(Error))
    })
  })
})

describe('when persisting device settings', () => {
  let settings: DeviceSettings

  beforeEach(() => {
    localStorage.clear()
    settings = { audioInputId: 'mic-1', audioOutputId: 'speaker-1', videoDeviceId: 'cam-1' }
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  describe('and nothing was saved', () => {
    it('should read back no settings', () => {
      expect(getDeviceSettings()).toBeNull()
    })
  })

  describe('and settings were saved', () => {
    beforeEach(() => {
      saveDeviceSettings(settings)
    })

    it('should read back the saved settings', () => {
      expect(getDeviceSettings()).toEqual(settings)
    })

    describe('and the settings are cleared', () => {
      beforeEach(() => {
        clearDeviceSettings()
      })

      it('should read back no settings', () => {
        expect(getDeviceSettings()).toBeNull()
      })
    })
  })

  describe('and the stored value is not valid JSON', () => {
    let consoleError: jest.SpyInstance

    beforeEach(() => {
      consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
      localStorage.setItem('dcl_cast_device_settings', '{not json')
    })

    it('should return null and log the failure', () => {
      expect(getDeviceSettings()).toBeNull()
      expect(consoleError).toHaveBeenCalledWith('[cast2/localStorage] Failed to read device settings', expect.any(Error))
    })
  })

  describe('and storage throws', () => {
    let consoleError: jest.SpyInstance

    beforeEach(() => {
      consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota')
      })
      jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('denied')
      })
    })

    it('should log instead of throwing when saving', () => {
      expect(() => saveDeviceSettings(settings)).not.toThrow()
      expect(consoleError).toHaveBeenCalledWith('[cast2/localStorage] Failed to save device settings', expect.any(Error))
    })

    it('should log instead of throwing when clearing', () => {
      expect(() => clearDeviceSettings()).not.toThrow()
      expect(consoleError).toHaveBeenCalledWith('[cast2/localStorage] Failed to clear device settings', expect.any(Error))
    })
  })
})

describe('when generating an anonymous identity', () => {
  let identity: ReturnType<typeof generateAnonymousIdentity>

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000)
    identity = generateAnonymousIdentity('room-1')
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it('should scope the id to the room with an anon prefix and the current timestamp', () => {
    expect(identity.id).toMatch(/^anon:room-1:1700000000000-[a-z0-9]+$/)
  })

  it('should give it an adjective-noun name', () => {
    expect(identity.name).toMatch(/^[a-z]+-[a-z]+$/)
  })

  it('should give it a hex avatar color', () => {
    expect(identity.avatar).toMatch(/^#[0-9A-F]{6}$/)
  })
})

describe('when generating a random name', () => {
  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  describe('and the random source returns its lowest value', () => {
    beforeEach(() => {
      jest.spyOn(Math, 'random').mockReturnValue(0)
    })

    it('should pick the first adjective and the first noun', () => {
      expect(generateRandomName()).toBe('happy-rabbit')
    })
  })

  describe('and the random source returns its highest value', () => {
    beforeEach(() => {
      jest.spyOn(Math, 'random').mockReturnValue(0.9999)
    })

    it('should pick the last adjective and the last noun', () => {
      expect(generateRandomName()).toBe('ancient-octopus')
    })
  })
})

describe('when creating a LiveKit identity', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should return an anonymous identity id for the room', () => {
    expect(createLiveKitIdentity('room-2')).toMatch(/^anon:room-2:\d+-[a-z0-9]+$/)
  })
})

describe('when getting a display name', () => {
  let participant: Participant

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  describe('and the metadata carries a displayName', () => {
    beforeEach(() => {
      participant = { identity: '0xabc', metadata: JSON.stringify({ displayName: 'Alice' }) } as Participant
    })

    it('should return the displayName', () => {
      expect(getDisplayName(participant)).toBe('Alice')
    })
  })

  describe('and the metadata has no displayName', () => {
    beforeEach(() => {
      participant = { identity: '0xabc', metadata: JSON.stringify({ role: 'streamer' }) } as Participant
    })

    it('should fall back to the identity', () => {
      expect(getDisplayName(participant)).toBe('0xabc')
    })
  })

  describe('and the metadata is not valid JSON', () => {
    let consoleWarn: jest.SpyInstance

    beforeEach(() => {
      consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
      participant = { identity: '0xabc', metadata: '{bad' } as Participant
    })

    it('should fall back to the identity and warn', () => {
      expect(getDisplayName(participant)).toBe('0xabc')
      expect(consoleWarn).toHaveBeenCalledWith('[cast2/getDisplayName] Failed to parse metadata', expect.any(Error))
    })
  })

  describe('and there is neither metadata nor identity', () => {
    beforeEach(() => {
      participant = { identity: '', metadata: undefined } as Participant
    })

    it('should return Anonymous', () => {
      expect(getDisplayName(participant)).toBe('Anonymous')
    })
  })
})

describe('when parsing participant metadata', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the metadata is valid JSON', () => {
    it('should return the parsed object', () => {
      expect(parseParticipantMetadata({ metadata: JSON.stringify({ role: 'presentation' }) })).toEqual({ role: 'presentation' })
    })
  })

  describe('and the metadata is empty', () => {
    it('should return null', () => {
      expect(parseParticipantMetadata({ metadata: '' })).toBeNull()
    })
  })

  describe('and the metadata is not valid JSON', () => {
    it('should return null', () => {
      expect(parseParticipantMetadata({ metadata: '{bad' })).toBeNull()
    })
  })
})

describe('when checking whether a video error code is retryable', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe.each(['video-timeout', 'video-server-error', 'video-playback-interrupted', 'video-stream-error', 'audio-processing-failed'])(
    'and the code is %s',
    code => {
      it('should be retryable', () => {
        expect(isRetryableVideoErrorCode(code)).toBe(true)
      })
    }
  )

  describe.each(['video-not-found', 'video-permission-denied', 'video-invalid-format', 'unknown'])('and the code is %s', code => {
    it('should not be retryable', () => {
      expect(isRetryableVideoErrorCode(code)).toBe(false)
    })
  })
})
