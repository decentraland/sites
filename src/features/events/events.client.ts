import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getEnv } from '../../config/env'
import { coordsKey, findEventAtCoords } from './events.helpers'
import { WhatsOnCardType } from './events.types'
import type { EventsResponse, HotScene, WhatsOnCard } from './events.types'

/**
 * WhatsOn cards logic:
 *
 * 1. Fetch live events + hot scenes in parallel
 * 2. Filter scenes with >= MIN_USERS online
 * 3. Cross-reference: if a hot scene's parcels match a live event's coordinates → event card
 * 4. Remaining hot scenes without events → place card
 * 5. Priority order: events (by users desc) > places (by users desc)
 * 6. Return at most MAX_CARDS for the homepage
 * 7. If fewer than MAX_CARDS, fill with Genesis Plaza (0,0)
 */

const EVENTS_API_URL = getEnv('EVENTS_API_URL') || 'https://events.decentraland.org/api'
const HOT_SCENES_URL = 'https://realm-provider-ea.decentraland.org/hot-scenes'

const MIN_USERS = 5
const MAX_CARDS = 3

const eventsClient = createApi({
  reducerPath: 'eventsClient',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['WhatsOn'],
  keepUnusedDataFor: 60,
  endpoints: build => ({
    getWhatsOnCards: build.query<WhatsOnCard[], void>({
      queryFn: async () => {
        try {
          const [eventsRes, scenesRes] = await Promise.all([
            fetch(`${EVENTS_API_URL}/events?list=live&limit=20&order=asc`),
            fetch(HOT_SCENES_URL)
          ])

          const eventsData: EventsResponse = await eventsRes.json()
          const scenesData: HotScene[] = await scenesRes.json()

          const liveEvents = eventsData.data ?? []
          const hotScenes = scenesData.filter(s => s.usersTotalCount >= MIN_USERS)

          const cards: WhatsOnCard[] = []
          const usedSceneIds = new Set<string>()

          // Priority 1: events that match a hot scene (have real users)
          for (const scene of hotScenes) {
            const matchedEvent = findEventAtCoords(liveEvents, scene.parcels)
            if (matchedEvent) {
              cards.push({
                type: WhatsOnCardType.EVENT,
                id: matchedEvent.id,
                title: matchedEvent.name,
                users: scene.usersTotalCount,
                image: matchedEvent.image,
                coordinates: coordsKey(matchedEvent.x, matchedEvent.y),
                url: matchedEvent.url,
                isLive: true
              })
              usedSceneIds.add(scene.id)
            }
          }

          // Sort events by users desc
          cards.sort((a, b) => b.users - a.users)

          // Priority 2: hot scenes without events
          const scenesWithoutEvents = hotScenes.filter(s => !usedSceneIds.has(s.id)).sort((a, b) => b.usersTotalCount - a.usersTotalCount)

          for (const scene of scenesWithoutEvents) {
            cards.push({
              type: WhatsOnCardType.PLACE,
              id: scene.id,
              title: scene.name,
              users: scene.usersTotalCount,
              image: scene.thumbnail,
              coordinates: coordsKey(scene.baseCoords[0], scene.baseCoords[1]),
              url: `https://decentraland.org/jump?position=${scene.baseCoords[0]},${scene.baseCoords[1]}`,
              isLive: true
            })
          }

          // Fill with Genesis Plaza if fewer than MAX_CARDS
          if (cards.length < MAX_CARDS) {
            const plaza = scenesData.find(s => s.name.toLowerCase().includes('genesis plaza'))
            const plazaAlreadyIncluded = plaza && cards.some(c => c.id === plaza.id)
            if (!plazaAlreadyIncluded) {
              const plazaCoords = plaza ? coordsKey(plaza.baseCoords[0], plaza.baseCoords[1]) : '0,0'
              cards.push({
                type: WhatsOnCardType.PLACE,
                id: plaza?.id ?? 'genesis-plaza',
                title: plaza?.name ?? 'Genesis Plaza',
                users: plaza?.usersTotalCount ?? 0,
                image: plaza?.thumbnail ?? '',
                coordinates: plazaCoords,
                url: `https://decentraland.org/jump?position=${plazaCoords}`,
                isLive: true
              })
            }
          }

          return { data: cards.slice(0, MAX_CARDS) }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: ['WhatsOn']
    })
  })
})

const { useGetWhatsOnCardsQuery } = eventsClient

export { eventsClient, useGetWhatsOnCardsQuery }
