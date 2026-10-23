import { ExploreCardType } from '../../../features/events/events.discovery.types'
import type { ExploreItem } from '../../../features/events/events.discovery.types'
import { canonicalPathForSelection, liveNowCardFromExploreItem, selectionFromExploreItem, selectionKey } from './HomeDetailModal.helpers'

const buildItem = (overrides: Partial<ExploreItem> = {}): ExploreItem => ({
  type: ExploreCardType.PLACE,
  id: 'place-1',
  title: 'Genesis Plaza',
  users: 12,
  image: 'https://example.com/plaza.png',
  coordinates: '0,0',
  creatorAddress: '0xabc',
  creatorName: 'Jane Doe',
  isGenesisPlaza: true,
  ...overrides
})

describe('when building a selection from an explore item', () => {
  describe('and the item is an event', () => {
    it('should select the event by id only', () => {
      expect(selectionFromExploreItem(buildItem({ type: ExploreCardType.EVENT, id: 'event-1' }))).toEqual({ kind: 'event', id: 'event-1' })
    })
  })

  describe('and the item is a place', () => {
    it('should keep the whole item so the modal can enrich it', () => {
      const item = buildItem()
      expect(selectionFromExploreItem(item)).toEqual({ kind: 'place', item })
    })
  })
})

describe('when resolving the canonical path of a selection', () => {
  describe('and it is an event', () => {
    it('should point at the events page with the id encoded', () => {
      expect(canonicalPathForSelection({ kind: 'event', id: 'a b/1' })).toBe('/events?id=a%20b%2F1')
    })
  })

  describe('and it is a place', () => {
    it('should point at the place detail page of its coordinates', () => {
      expect(canonicalPathForSelection({ kind: 'place', item: buildItem({ coordinates: '-12,34' }) })).toBe('/places/place/-12,34')
    })
  })
})

describe('when keying a selection', () => {
  it('should tell events and places with the same id apart', () => {
    expect(selectionKey({ kind: 'event', id: '1' })).not.toBe(selectionKey({ kind: 'place', item: buildItem({ id: '1' }) }))
  })

  it('should key a place by its coordinates', () => {
    expect(selectionKey({ kind: 'place', item: buildItem({ coordinates: '5,6' }) })).toBe('place:5,6')
  })

  it('should key an event by its id', () => {
    expect(selectionKey({ kind: 'event', id: 'abc' })).toBe('event:abc')
  })
})

describe('when building a live-now card from an explore item', () => {
  it('should carry over only the fields the live-now card shares', () => {
    expect(liveNowCardFromExploreItem(buildItem())).toEqual({
      type: ExploreCardType.PLACE,
      id: 'place-1',
      title: 'Genesis Plaza',
      image: 'https://example.com/plaza.png',
      users: 12,
      coordinates: '0,0',
      creatorAddress: '0xabc',
      creatorName: 'Jane Doe',
      isGenesisPlaza: true
    })
  })

  describe('and the item has no creator', () => {
    it('should leave the creator fields undefined', () => {
      const card = liveNowCardFromExploreItem(buildItem({ creatorAddress: undefined, creatorName: undefined }))
      expect(card.creatorAddress).toBeUndefined()
      expect(card.creatorName).toBeUndefined()
    })
  })
})
