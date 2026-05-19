import { buildJumpInHref, parsePositionParam } from './discover.helpers'
import type { SocialPlace } from './discover.types'

function makePlace(overrides: Partial<SocialPlace>): SocialPlace {
  return {
    id: 'place-id',
    title: 'Place',
    description: '',
    image: '',
    positions: [],
    owner: null,
    ...overrides
  }
}

describe('when parsePositionParam is called', () => {
  describe('and the value is a valid "x,y" string', () => {
    it('should return the parsed coordinates', () => {
      expect(parsePositionParam('-3,-2')).toEqual([-3, -2])
    })
  })

  describe('and the value has surrounding whitespace', () => {
    it('should trim and parse', () => {
      expect(parsePositionParam('  10,20  ')).toEqual([10, 20])
    })
  })

  describe('and the value is malformed', () => {
    it('should return undefined for missing comma', () => {
      expect(parsePositionParam('3-2')).toBeUndefined()
    })

    it('should return undefined for non-integers', () => {
      expect(parsePositionParam('3.5,2')).toBeUndefined()
    })

    it('should return undefined for empty input', () => {
      expect(parsePositionParam('')).toBeUndefined()
    })

    it('should return undefined for undefined input', () => {
      expect(parsePositionParam(undefined)).toBeUndefined()
    })
  })
})

describe('when buildJumpInHref is called', () => {
  describe('and the place is a world with a world_name', () => {
    it('should build a decentraland:// realm deep link with lowercased ENS name', () => {
      const href = buildJumpInHref(makePlace({ world: true, world_name: 'MyWorld.dcl.eth' }))
      expect(href).toBe('decentraland://?realm=myworld.dcl.eth')
    })
  })

  describe('and the place has a base_position', () => {
    it('should build a decentraland:// position deep link', () => {
      const href = buildJumpInHref(makePlace({ base_position: '-3,-2' }))
      expect(href).toBe('decentraland://?position=-3%2C-2')
    })
  })

  describe('and the place has no base_position but has positions[0]', () => {
    it('should fall back to the first position', () => {
      const href = buildJumpInHref(makePlace({ positions: ['10,20'] }))
      expect(href).toBe('decentraland://?position=10%2C20')
    })
  })

  describe('and the place has no positions and is not a world', () => {
    it('should return the bare protocol URL', () => {
      const href = buildJumpInHref(makePlace({}))
      expect(href).toBe('decentraland://')
    })
  })
})
