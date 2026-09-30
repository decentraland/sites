import type { Participant } from 'livekit-client'
import { isPresentationBot } from './cast2.utils'

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
