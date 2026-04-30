import type { JumpPlace } from '../../../features/jump'
import { normalizeJumpPlace } from './normalizers'

function createMockJumpPlace(overrides: Partial<JumpPlace> = {}): JumpPlace {
  return {
    id: 'place-1',
    title: 'Genesis Plaza',
    image: 'https://example.com/place.png',
    description: 'The heart of Decentraland',
    positions: ['10,20'],
    base_position: '10,20',
    owner: '0xOwner',
    contact_name: 'Decentraland Foundation',
    favorites: 100,
    user_count: 5,
    world: false,
    ...overrides
  }
}

describe('normalizeJumpPlace', () => {
  describe('when normalizing a regular place with all fields', () => {
    let result: ReturnType<typeof normalizeJumpPlace>

    beforeEach(() => {
      result = normalizeJumpPlace(createMockJumpPlace())
    })

    it('should map the id, title, description, image', () => {
      expect(result.id).toBe('place-1')
      expect(result.title).toBe('Genesis Plaza')
      expect(result.description).toBe('The heart of Decentraland')
      expect(result.image).toBe('https://example.com/place.png')
    })

    it('should parse base_position into coordinates', () => {
      expect(result.coordinates).toEqual([10, 20])
    })

    it('should map favorites and user_count', () => {
      expect(result.favorites).toBe(100)
      expect(result.userCount).toBe(5)
    })

    it('should mark the place as not a world', () => {
      expect(result.isWorld).toBe(false)
      expect(result.worldName).toBeNull()
    })

    it('should map owner address and prefer the owner over contact_name', () => {
      expect(result.ownerAddress).toBe('0xOwner')
      expect(result.ownerName).toBe('0xOwner')
    })
  })

  describe('when the place has no owner but has a contact_name', () => {
    let result: ReturnType<typeof normalizeJumpPlace>

    beforeEach(() => {
      result = normalizeJumpPlace(createMockJumpPlace({ owner: null, contact_name: 'Decentraland Foundation' }))
    })

    it('should leave ownerAddress undefined', () => {
      expect(result.ownerAddress).toBeUndefined()
    })

    it('should fall back to contact_name for ownerName', () => {
      expect(result.ownerName).toBe('Decentraland Foundation')
    })
  })

  describe('when the place is a world', () => {
    let result: ReturnType<typeof normalizeJumpPlace>

    beforeEach(() => {
      result = normalizeJumpPlace(createMockJumpPlace({ world: true, world_name: 'towerofmadness.dcl.eth', base_position: '0,0' }))
    })

    it('should mark isWorld and expose worldName', () => {
      expect(result.isWorld).toBe(true)
      expect(result.worldName).toBe('towerofmadness.dcl.eth')
    })
  })

  describe('when favorites and user_count are missing', () => {
    let result: ReturnType<typeof normalizeJumpPlace>

    beforeEach(() => {
      result = normalizeJumpPlace(createMockJumpPlace({ favorites: undefined, user_count: undefined }))
    })

    it('should default both to 0', () => {
      expect(result.favorites).toBe(0)
      expect(result.userCount).toBe(0)
    })
  })

  describe('when the description is empty', () => {
    it('should normalize to null', () => {
      const result = normalizeJumpPlace(createMockJumpPlace({ description: '' }))

      expect(result.description).toBeNull()
    })
  })
})
