import {
  buildJumpInHref,
  discoverDeepLinkOptions,
  discoverPlacePayload,
  isHiddenPlace,
  isMapPlaceholderImage,
  parsePositionParam,
  placeCoordsLabel,
  placeCoverImage,
  placeIsFeatured,
  placePlayers
} from './discover.helpers'
import type { DiscoverPlace } from './discover.types'

const MAP_TILE = 'https://api.decentraland.org/v2/map.png?height=1024&width=1024'
const REAL_IMAGE = 'https://peer.decentraland.org/content/contents/bafkreigabc123'

function makePlace(overrides: Partial<DiscoverPlace>): DiscoverPlace {
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

describe('when discoverDeepLinkOptions is called', () => {
  describe('and the place is a world', () => {
    it('should return the lowercased world name as the realm', () => {
      expect(discoverDeepLinkOptions(makePlace({ world: true, world_name: 'MyWorld.dcl.eth' }))).toEqual({ realm: 'myworld.dcl.eth' })
    })
  })

  describe('and the place is a Genesis City parcel', () => {
    it('should return the base position', () => {
      expect(discoverDeepLinkOptions(makePlace({ base_position: '-3,-2' }))).toEqual({ position: '-3,-2' })
    })

    it('should fall back to the first parcel when base_position is missing', () => {
      expect(discoverDeepLinkOptions(makePlace({ positions: ['10,20'] }))).toEqual({ position: '10,20' })
    })
  })

  describe('and the place has no coordinates', () => {
    it('should return empty options', () => {
      expect(discoverDeepLinkOptions(makePlace({}))).toEqual({})
    })
  })
})

describe('when placeIsFeatured is called', () => {
  describe('and the place is highlighted', () => {
    it('should return true', () => {
      expect(placeIsFeatured(makePlace({ highlighted: true }))).toBe(true)
    })
  })

  describe('and the place is not highlighted', () => {
    it('should return false', () => {
      expect(placeIsFeatured(makePlace({ highlighted: false, categories: ['poi'] }))).toBe(false)
    })
  })

  describe('and the place has no highlighted flag', () => {
    it('should return false', () => {
      expect(placeIsFeatured(makePlace({}))).toBe(false)
    })
  })
})

describe('when placePlayers is called', () => {
  describe('and the place has a user_count', () => {
    it('should return the count', () => {
      expect(placePlayers(makePlace({ user_count: 7 }))).toBe(7)
    })
  })

  describe('and the place has no user_count', () => {
    it('should return 0', () => {
      expect(placePlayers(makePlace({}))).toBe(0)
    })
  })
})

describe('when placeCoordsLabel is called', () => {
  describe('and the place is a world with a world_name', () => {
    it('should return the world name', () => {
      expect(placeCoordsLabel(makePlace({ world: true, world_name: 'foo.dcl.eth' }))).toBe('foo.dcl.eth')
    })
  })

  describe('and the place is a world without a world_name', () => {
    it('should return undefined', () => {
      expect(placeCoordsLabel(makePlace({ world: true }))).toBeUndefined()
    })
  })

  describe('and the place has a base_position', () => {
    it('should return the base position', () => {
      expect(placeCoordsLabel(makePlace({ base_position: '-3,-2', positions: ['0,0'] }))).toBe('-3,-2')
    })
  })

  describe('and the place has only positions', () => {
    it('should return the first position', () => {
      expect(placeCoordsLabel(makePlace({ positions: ['10,20'] }))).toBe('10,20')
    })
  })
})

describe('when isMapPlaceholderImage is called', () => {
  describe('and the image is the Genesis City map tile', () => {
    it('should return true', () => {
      expect(isMapPlaceholderImage(MAP_TILE)).toBe(true)
    })
  })

  describe('and the image is missing', () => {
    it('should return true for an empty string', () => {
      expect(isMapPlaceholderImage('')).toBe(true)
    })

    it('should return true for undefined', () => {
      expect(isMapPlaceholderImage(undefined)).toBe(true)
    })
  })

  describe('and the image is a real content-server screenshot', () => {
    it('should return false', () => {
      expect(isMapPlaceholderImage(REAL_IMAGE)).toBe(false)
    })
  })
})

describe('when placeCoverImage is called', () => {
  describe('and the place has a real screenshot', () => {
    it('should return the image', () => {
      expect(placeCoverImage(makePlace({ image: REAL_IMAGE }))).toBe(REAL_IMAGE)
    })
  })

  describe('and the place only has the map-tile placeholder', () => {
    it('should return undefined so the card renders its solid fallback', () => {
      expect(placeCoverImage(makePlace({ image: MAP_TILE }))).toBeUndefined()
    })
  })

  describe('and the place has no image', () => {
    it('should return undefined', () => {
      expect(placeCoverImage(makePlace({ image: '' }))).toBeUndefined()
    })
  })
})

describe('when isHiddenPlace is called', () => {
  describe('and the place is an interactive-text test deploy', () => {
    it('should be hidden regardless of image or categories', () => {
      expect(isHiddenPlace(makePlace({ title: 'my interactive-text demo', image: REAL_IMAGE, categories: ['art'] }))).toBe(true)
    })
  })

  describe('and the place is an auto-generated road', () => {
    it('should be hidden when the title is "Road at ..." with no categories', () => {
      expect(isHiddenPlace(makePlace({ title: 'Road at 1,-109 (empty fork EmptyFork_C)', image: MAP_TILE, categories: [] }))).toBe(true)
    })

    it('should NOT hide a categorized scene that merely starts with "Road at"', () => {
      expect(isHiddenPlace(makePlace({ title: 'Road at the Edge', image: REAL_IMAGE, categories: ['art'], user_name: 'RoadArtist' }))).toBe(
        false
      )
    })
  })

  describe('and the place is an empty parcel (map tile, no category)', () => {
    it('should be hidden', () => {
      expect(isHiddenPlace(makePlace({ title: 'Empty', image: MAP_TILE, categories: [] }))).toBe(true)
    })
  })

  describe('and the place is a real scene', () => {
    it('should NOT hide a described scene with a real screenshot', () => {
      expect(
        isHiddenPlace(
          makePlace({ title: 'Cool Gallery', image: REAL_IMAGE, categories: [], description: 'Rotating exhibits', user_name: 'Curator' })
        )
      ).toBe(false)
    })

    it('should hide a categorized scene without a real thumbnail (template covers are junk signals)', () => {
      expect(isHiddenPlace(makePlace({ title: 'New Scene', image: MAP_TILE, categories: ['game'] }))).toBe(true)
    })

    it('should hide a scene whose cover is the SDK7 template default thumbnail', () => {
      expect(
        isHiddenPlace(
          makePlace({
            title: 'Untitled Scene',
            image: 'https://peer.decentraland.org/content/contents/bafkreidj26s7aenyxfthfdibnqonzqm5ptc4iamml744gmcyuokewkr76y',
            categories: ['art'],
            description: 'described'
          })
        )
      ).toBe(true)
    })
  })

  describe('and the place is a world', () => {
    it('should hide a quiet world without art (nothing to show, nobody inside)', () => {
      expect(
        isHiddenPlace(
          makePlace({ title: 'MyWorld', image: '', categories: [], world: true, world_name: 'myworld.dcl.eth', description: 'Hang out' })
        )
      ).toBe(true)
    })

    it('should keep an art-less world while people are inside (LIVE rail fallback)', () => {
      expect(
        isHiddenPlace(
          makePlace({
            title: 'MyWorld',
            image: '',
            categories: [],
            world: true,
            world_name: 'myworld.dcl.eth',
            description: 'Hang out',
            user_count: 2
          })
        )
      ).toBe(false)
    })
  })
})

describe('when discoverPlacePayload is called', () => {
  describe('and the place has full metadata', () => {
    it('should build the snake_case payload with position and user_count', () => {
      const payload = discoverPlacePayload(
        makePlace({ id: 'p1', title: 'Plaza', base_position: '-3,-2', positions: ['0,0'], user_count: 12 })
      )

      expect(payload).toEqual({ place_id: 'p1', place_title: 'Plaza', world: false, position: '-3,-2', user_count: 12 })
    })
  })

  describe('and the place is a world', () => {
    it('should include world_name and flag world true', () => {
      const payload = discoverPlacePayload(makePlace({ id: 'w1', title: 'My World', world: true, world_name: 'foo.dcl.eth' }))

      expect(payload).toEqual({ place_id: 'w1', place_title: 'My World', world: true, world_name: 'foo.dcl.eth' })
    })
  })

  describe('and optional fields are absent', () => {
    it('should omit them instead of sending undefined', () => {
      const payload = discoverPlacePayload(makePlace({ id: 'p2', title: 'Bare' }))

      expect(payload).toEqual({ place_id: 'p2', place_title: 'Bare', world: false })
      expect(Object.values(payload)).not.toContain(undefined)
    })
  })
})

describe('when isHiddenPlace evaluates anonymous placeholder deploys', () => {
  it('should hide a metadata-less "Empty" scene even with a real screenshot', () => {
    expect(isHiddenPlace(makePlace({ title: 'Empty', image: REAL_IMAGE, description: '', categories: [], owner: null }))).toBe(true)
  })

  it('should hide an "Empty"-titled scene even while people are inside (the title is junk, period)', () => {
    expect(isHiddenPlace(makePlace({ title: 'Empty', image: REAL_IMAGE, categories: [], owner: null, user_count: 3 }))).toBe(true)
  })

  it('should hide an "Empty"-titled owned entry too (the title rule is unconditional)', () => {
    expect(isHiddenPlace(makePlace({ title: 'Empty', image: REAL_IMAGE, categories: [], owner: '0xabc' }))).toBe(true)
  })

  it('should hide an anonymous parcel even while people are inside (junk is junk)', () => {
    expect(isHiddenPlace(makePlace({ title: 'Hangout Spot', image: REAL_IMAGE, categories: [], owner: null, user_count: 3 }))).toBe(true)
  })

  it('should treat the sdk-commands default contact ("SDK") as no identity at all', () => {
    expect(isHiddenPlace(makePlace({ title: '<->', image: REAL_IMAGE, categories: [], owner: null, contact_name: 'SDK' }))).toBe(true)
  })

  it('should hide an identity-less scene even when described and categorized', () => {
    expect(
      isHiddenPlace(
        makePlace({
          title: '<->',
          image: REAL_IMAGE,
          description: 'land survey',
          categories: ['social', 'music', 'art'],
          owner: null,
          contact_name: 'SDK'
        })
      )
    ).toBe(true)
  })

  it('should hide a metadata-less world that is not live', () => {
    expect(
      isHiddenPlace(makePlace({ title: 'Empty', image: '', world: true, world_name: 'empty.dcl.eth', categories: [], owner: null }))
    ).toBe(true)
  })

  it('should NOT hide the synthesized live-world fallback shape', () => {
    expect(
      isHiddenPlace(
        makePlace({ title: 'foo.dcl.eth', image: '', world: true, world_name: 'foo.dcl.eth', categories: [], owner: null, user_count: 2 })
      )
    ).toBe(false)
  })

  it('should NOT hide a scene with a real creator identity', () => {
    expect(
      isHiddenPlace(makePlace({ title: 'asset-load', image: REAL_IMAGE, categories: [], owner: null, user_name: 'RealCreator' }))
    ).toBe(false)
  })
})
