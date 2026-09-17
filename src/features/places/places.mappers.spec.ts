import { buildGenericPlace, fromEvent, fromPlace } from './places.mappers'
import type { JumpEvent, JumpPlace } from './places.types'

describe('jump.mappers', () => {
  describe('when fromPlace is called', () => {
    describe('and the place has world metadata', () => {
      const place: JumpPlace = {
        id: 'p1',
        title: 'Cool World',
        image: 'https://img/1.png',
        description: 'An awesome world',
        positions: ['0,0'],
        base_position: '5,-10',
        owner: '0xOwner',
        favorites: 42,
        world: true,
        world_name: 'cool.dcl.eth',
        user_count: 3
      }

      it('should map coordinates from base_position', () => {
        expect(fromPlace(place).coordinates).toEqual([5, -10])
      })

      it('should set type to place and surface the world_name as realm', () => {
        const result = fromPlace(place)
        expect(result.type).toBe('place')
        expect(result.realm).toBe('cool.dcl.eth')
      })
    })

    describe('and the owner is missing but contact_name is a non-foundation author', () => {
      const place: JumpPlace = {
        id: 'p2',
        title: 'Contact Place',
        image: 'https://img/2.png',
        description: 'desc',
        positions: ['0,0'],
        base_position: '1,2',
        owner: null,
        contact_name: 'Alice',
        user_count: 0
      }

      it('should use contact_name as user_name', () => {
        expect(fromPlace(place).user_name).toBe('Alice')
      })

      it('should leave user_avatar undefined so the default avatar is used', () => {
        expect(fromPlace(place).user_avatar).toBeUndefined()
      })
    })

    describe('and the place is credited to the Decentraland Foundation', () => {
      const place: JumpPlace = {
        id: 'p-genesis',
        title: 'Genesis Plaza',
        image: '',
        description: '',
        positions: ['0,0'],
        base_position: '0,0',
        owner: null,
        contact_name: 'Decentraland Foundation'
      }

      it('should set user_avatar to the Decentraland logo', () => {
        expect(fromPlace(place).user_avatar).toBeDefined()
      })

      it('should surface the foundation name as user_name', () => {
        expect(fromPlace(place).user_name).toBe('Decentraland Foundation')
      })
    })

    describe('and the place has an on-chain owner', () => {
      const place: JumpPlace = {
        id: 'p4',
        title: 'User Place',
        image: '',
        description: '',
        positions: ['0,0'],
        base_position: '0,0',
        owner: '0x1e105bb21375451990378e5c9d0d3ad0e9ce8e58',
        contact_name: 'LowPolyModels'
      }

      it('should leave user_avatar undefined so the Catalyst avatar wins when resolved', () => {
        expect(fromPlace(place).user_avatar).toBeUndefined()
      })

      it('should credit the scene contact rather than the wallet that holds the land', () => {
        expect(fromPlace(place).user_name).toBe('LowPolyModels')
      })

      it('should never render the wallet itself as the creator', () => {
        expect(fromPlace({ ...place, contact_name: undefined }).user_name).toBe('Unknown')
        expect(fromPlace({ ...place, contact_name: undefined }).user).toBe(place.owner)
      })
    })

    describe('and both owner and contact_name are missing', () => {
      const place: JumpPlace = {
        id: 'p3',
        title: 'Nameless',
        image: '',
        description: '',
        positions: ['0,0'],
        base_position: '0,0',
        owner: null
      }

      it('should default user_name to Unknown', () => {
        expect(fromPlace(place).user_name).toBe('Unknown')
      })

      it('should leave user undefined when there is no owner', () => {
        expect(fromPlace(place).user).toBeUndefined()
      })
    })

    describe('and the owner is a real wallet address', () => {
      const place: JumpPlace = {
        id: 'p5',
        title: 'Owned World',
        image: '',
        description: '',
        positions: ['0,0'],
        base_position: '0,0',
        owner: '0xd46a1da2aae4afc4a272dc3f28b2025ae9c18df1',
        world: true,
        world_name: 'dexou.dcl.eth'
      }

      it('should expose the address as user so the profile link resolves', () => {
        expect(fromPlace(place).user).toBe('0xd46a1da2aae4afc4a272dc3f28b2025ae9c18df1')
      })
    })

    describe('and the owner is a Places API display string instead of an address', () => {
      // Some (notably stale) World records carry a display string in `owner`,
      // e.g. zone returns "dexou by xyz.lb" for dexou.dcl.eth.
      const place: JumpPlace = {
        id: 'p6',
        title: 'DEXOU',
        image: '',
        description: '',
        positions: ['0,0'],
        base_position: '0,0',
        owner: 'dexou by xyz.lb                           ',
        world: true,
        world_name: 'dexou.dcl.eth'
      }

      it('should not turn the display string into a profile link (user stays undefined)', () => {
        expect(fromPlace(place).user).toBeUndefined()
      })

      it('should still surface the display string as the creator name', () => {
        expect(fromPlace(place).user_name).toBe('dexou by xyz.lb                           ')
      })
    })

    describe('and the owner is a whitespace-padded address', () => {
      // The address validator is anchored and does not trim, so a padded value
      // is rejected — guards against feeding a non-canonical address to the link.
      const place: JumpPlace = {
        id: 'p7',
        title: 'Padded',
        image: '',
        description: '',
        positions: ['0,0'],
        base_position: '0,0',
        owner: ' 0xd46a1da2aae4afc4a272dc3f28b2025ae9c18df1 '
      }

      it('should leave user undefined', () => {
        expect(fromPlace(place).user).toBeUndefined()
      })
    })
  })

  describe('when fromEvent is called', () => {
    const event: JumpEvent = {
      id: 'e1',
      name: 'Hello World Event',
      image: 'https://img/e.png',
      description: 'desc',
      start_at: '2030-01-01T00:00:00Z',
      finish_at: '2030-01-01T02:00:00Z',
      next_start_at: '2030-01-01T00:00:00Z',
      next_finish_at: '2030-01-01T02:00:00Z',
      coordinates: [10, 20],
      recurrent: false,
      user: '0xUser',
      user_name: 'Creator',
      total_attendees: 4,
      attending: false,
      scene_name: 'Plaza',
      position: [10, 20],
      x: 10,
      y: 20,
      world: false,
      live: false
    }

    it('should set the type to event', () => {
      expect(fromEvent(event).type).toBe('event')
    })

    it('should derive the position string from coordinates', () => {
      expect(fromEvent(event).position).toBe('10,20')
    })

    describe('and the event is a world event with a server', () => {
      const worldEvent: JumpEvent = { ...event, world: true, server: 'realm.dcl.eth' }

      it('should expose the server as realm', () => {
        expect(fromEvent(worldEvent).realm).toBe('realm.dcl.eth')
      })
    })

    describe('and the event is not a world event', () => {
      it('should leave realm undefined', () => {
        expect(fromEvent(event).realm).toBeUndefined()
      })
    })
  })

  describe('when buildGenericPlace is called', () => {
    describe('and a realm is provided', () => {
      it('should surface the realm as both title and realm', () => {
        const result = buildGenericPlace({ coordinates: [0, 0], realm: 'foo.dcl.eth' })
        expect(result.title).toBe('foo.dcl.eth')
        expect(result.realm).toBe('foo.dcl.eth')
      })
    })

    describe('and no realm is provided', () => {
      it('should return Decentraland as scene_name and position from coordinates', () => {
        const result = buildGenericPlace({ coordinates: [5, -5] })
        expect(result.scene_name).toBe('Decentraland')
        expect(result.position).toBe('5,-5')
      })
    })
  })
})
