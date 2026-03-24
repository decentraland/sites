import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getEnv } from '../../config/env'
import { buildPlazaCard, coordsKey, findEventAtCoords } from './events.helpers'
import { WhatsOnCardType } from './events.types'
import type { EventsResponse, HotScene, WhatsOn } from './events.types'

/**
 * WhatsOn cards logic:
 *
 * 1. Fetch live events + hot scenes in parallel
 * 2. Filter scenes with >= MIN_USERS online
 * 3. Cross-reference: if a hot scene's parcels match a live event's coordinates → event card
 * 4. Remaining hot scenes without events → place card
 * 5. Priority order: events (by users desc) > places (by users desc)
 * 6. Return at most MAX_CARDS for the homepage
 * 7. If fewer than MAX_CARDS, fill with Genesis Plaza
 */

const MIN_USERS = 5
const MAX_CARDS = 3

const eventsClient = createApi({
  reducerPath: 'eventsClient',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['WhatsOn'],
  keepUnusedDataFor: 60,
  endpoints: build => ({
    getWhatsOnCards: build.query<WhatsOn[], void>({
      queryFn: async () => {
        try {
          const eventsApiUrl = getEnv('EVENTS_API_URL') || 'https://events.decentraland.org/api'
          const hotScenesUrl = getEnv('HOT_SCENES_URL') || 'https://realm-provider-ea.decentraland.org/hot-scenes'

          const [eventsRes, scenesRes] = await Promise.all([
            fetch(`${eventsApiUrl}/events?list=live&limit=20&order=asc&world=false`),
            fetch(hotScenesUrl)
          ])

          if (!eventsRes.ok || !scenesRes.ok) {
            throw new Error('Failed to fetch events or hot scenes')
          }

          const [eventsData, scenesData]: [EventsResponse, HotScene[]] = await Promise.all([eventsRes.json(), scenesRes.json()])

          const liveEvents = eventsData.data ?? []
          const hotScenes = scenesData.filter(s => s.usersTotalCount >= MIN_USERS)

          const cards: WhatsOn[] = []
          const usedSceneIds = new Set<string>()
          const usedEventIds = new Set<string>()

          // Priority 1: events that match a hot scene (have real users)
          for (const scene of hotScenes) {
            const matchedEvent = findEventAtCoords(liveEvents, scene.parcels)
            if (matchedEvent && !usedEventIds.has(matchedEvent.id)) {
              cards.push({
                type: WhatsOnCardType.EVENT,
                id: matchedEvent.id,
                title: matchedEvent.name,
                users: scene.usersTotalCount,
                image: matchedEvent.image,
                coordinates: coordsKey(matchedEvent.x, matchedEvent.y),
                creatorAddress: matchedEvent.user
              })
              usedSceneIds.add(scene.id)
              usedEventIds.add(matchedEvent.id)
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
              coordinates: coordsKey(scene.baseCoords[0], scene.baseCoords[1])
            })
          }

          // Fill with Genesis Plaza if fewer than MAX_CARDS
          if (cards.length < MAX_CARDS) {
            const plazaCard = buildPlazaCard(scenesData)
            const plazaAlreadyIncluded = cards.some(c => c.id === plazaCard.id)
            if (!plazaAlreadyIncluded) {
              cards.push(plazaCard)
            }
          }

          return { data: cards.slice(0, MAX_CARDS) }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: ['WhatsOn']
    })
  })
})

const { useGetWhatsOnCardsQuery } = eventsClient

export { eventsClient, useGetWhatsOnCardsQuery }
