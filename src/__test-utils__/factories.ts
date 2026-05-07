/* eslint-disable @typescript-eslint/naming-convention */
import type { ModalEventData } from '../components/whats-on/EventDetailModal/EventDetailModal.types'
import type { HotScene, LiveNowCard } from '../features/experiences/events/events.helpers'
import type { EventEntry } from '../features/experiences/events/events.types'

function createMockEvent(overrides: Partial<EventEntry> = {}): EventEntry {
  return {
    id: 'event-1',
    name: 'Test Event',
    description: null,
    image: 'https://example.com/event.png',
    image_vertical: null,
    start_at: '2026-04-07T10:00:00Z',
    finish_at: '2026-04-07T12:00:00Z',
    next_start_at: '2026-04-07T10:00:00Z',
    next_finish_at: '2026-04-07T12:00:00Z',
    duration: 7200,
    all_day: false,
    x: 10,
    y: 20,
    coordinates: [10, 20],
    position: [10, 20],
    server: null,
    url: 'https://events.decentraland.org/event/1',
    user: '0xCreator',
    user_name: 'CreatorName',
    estate_id: null,
    estate_name: null,
    scene_name: null,
    approved: true,
    rejected: false,
    rejection_reason: null,
    highlighted: false,
    trending: false,
    recurrent: false,
    recurrent_frequency: null,
    recurrent_dates: [],
    contact: null,
    details: null,
    categories: [],
    schedules: [],
    world: false,
    place_id: null,
    community_id: null,
    total_attendees: 0,
    latest_attendees: [],
    attending: false,
    live: true,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
    ...overrides
  }
}

function createMockScene(overrides: Partial<HotScene> = {}): HotScene {
  return {
    id: 'scene-1',
    name: 'Test Scene',
    baseCoords: [10, 20],
    usersTotalCount: 10,
    parcels: [[10, 20]],
    thumbnail: 'https://example.com/scene.png',
    ...overrides
  }
}

function createMockLiveNowCard(overrides: Partial<LiveNowCard> = {}): LiveNowCard {
  return {
    id: 'card-1',
    type: 'event',
    title: 'Live Party',
    image: 'https://example.com/scene.png',
    users: 15,
    coordinates: '10,20',
    creatorAddress: '0xABC',
    creatorName: 'DJ Cool',
    isGenesisPlaza: false,
    ...overrides
  }
}

function createMockPlaceCard(overrides: Partial<LiveNowCard> = {}): LiveNowCard {
  return {
    id: 'place-1',
    type: 'place',
    title: 'Test Place',
    image: 'https://example.com/place.png',
    users: 10,
    coordinates: '10,20',
    isGenesisPlaza: false,
    ...overrides
  }
}

function createMockModalData(overrides: Partial<ModalEventData> = {}): ModalEventData {
  return {
    id: 'event-1',
    name: 'Test Event',
    description: 'A great event',
    image: 'https://example.com/event.png',
    x: 10,
    y: 20,
    creatorAddress: '0xCreator',
    creatorName: 'CreatorName',
    startAt: '2026-04-07T10:00:00Z',
    finishAt: '2026-04-07T12:00:00Z',
    recurrent: false,
    recurrentFrequency: null,
    recurrentDates: [],
    totalAttendees: 42,
    attending: false,
    live: false,
    categories: ['music'],
    url: 'https://decentraland.org/jump/event?position=10,20',
    isEvent: true,
    ...overrides
  }
}

export { createMockEvent, createMockLiveNowCard, createMockModalData, createMockPlaceCard, createMockScene }
