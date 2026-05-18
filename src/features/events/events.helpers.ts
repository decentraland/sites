import { assetUrl } from '../../utils/assetUrl'
import { isSameLocalDay } from '../../utils/whatsOnDate'
import { DCL_FOUNDATION_NAME, coordsKey } from './events.discovery.helpers'
import type { ActiveEntity, DeploymentResponse, HotScene } from './events.discovery.types'
import type { EventEntry, RecurrentFrequency } from './events.types'

interface LiveNowCard {
  id: string
  type: 'event' | 'place'
  title: string
  image: string
  users: number
  coordinates: string
  creatorAddress?: string
  creatorName?: string
  isGenesisPlaza: boolean
  description?: string | null
  categories?: string[]
  startAt?: string
  finishAt?: string
  recurrent?: boolean
  recurrentFrequency?: RecurrentFrequency | null
  recurrentInterval?: number | null
  recurrentWeekdayMask?: number | null
  recurrentCount?: number | null
  recurrentUntil?: string | null
  recurrentDates?: string[]
  attending?: boolean
  world?: boolean
  server?: string | null
}

const DEFAULT_MIN_USERS = 5
const DCL_FOUNDATION_NAME_LOWER = DCL_FOUNDATION_NAME.toLowerCase()
const DCL_FOUNDATION_LOGO_URL = assetUrl('/dcl-logo.svg')

function isDclFoundationCreator(creatorName: string | null | undefined): boolean {
  return creatorName?.trim().toLowerCase() === DCL_FOUNDATION_NAME_LOWER
}

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000
const MAX_EXPANSION = 1000

// The events API caps `recurrent_dates` at the next ~10 occurrences (see
// MAX_EVENT_RECURRENT in decentraland/events). The cron slides that window
// forward as each occurrence ends, but a user navigating the calendar more
// than a few weeks ahead sees the edge of the materialized window before the
// cron catches up. We extend recurrent_dates on the client up to the last
// visible day (or recurrent_until, whichever is sooner) using the recurrence
// rule fields. Defense-in-depth alongside the server-side fix; once every
// event has been re-materialized with a larger cap this helper becomes a
// no-op in practice.
function expandRecurrentDates(event: EventEntry, untilDate: Date): string[] {
  const materialized = event.recurrent_dates
  if (!event.recurrent || !materialized || materialized.length === 0) {
    return materialized ?? []
  }
  // Honor explicit count — that's the creator's intent, don't synthesize past it.
  if (event.recurrent_count != null) {
    return materialized
  }

  const lastMaterializedTs = new Date(materialized[materialized.length - 1]).getTime()
  const untilDateTs = untilDate.getTime()
  const recurrentUntilTs = event.recurrent_until ? new Date(event.recurrent_until).getTime() : null
  // Recurrence rule already ended, or already covers the visible range.
  if (lastMaterializedTs >= untilDateTs) return materialized
  if (recurrentUntilTs != null && recurrentUntilTs <= lastMaterializedTs) return materialized

  const cap = recurrentUntilTs != null ? Math.min(recurrentUntilTs, untilDateTs) : untilDateTs
  const interval = Math.max(event.recurrent_interval ?? 1, 1)
  const next = pickNextDateGenerator(event.recurrent_frequency, interval, materialized)
  if (!next) return materialized

  const expanded = [...materialized]
  let current = new Date(lastMaterializedTs)
  for (let i = 0; i < MAX_EXPANSION; i++) {
    const candidate = next(current)
    if (candidate.getTime() > cap) break
    expanded.push(candidate.toISOString())
    current = candidate
  }
  return expanded
}

// Returns a function that, given the previous occurrence, produces the next one
// per the recurrence rule. WEEKLY needs cycle detection because multi-weekday
// rules (e.g. MWF) have non-uniform deltas summing to 7 days × interval. The
// other frequencies are uniform or use calendar math.
function pickNextDateGenerator(
  frequency: RecurrentFrequency | null,
  interval: number,
  materialized: string[]
): ((current: Date) => Date) | null {
  switch (frequency) {
    case 'WEEKLY': {
      const cycle = detectWeeklyCycle(materialized, interval)
      if (cycle.length === 0) return null
      // We don't know where in the cycle the last materialized date sits when
      // dates were truncated to the last N entries. Use the cycle's offsets
      // sequentially starting from index 0 — for single-day weekly the cycle
      // has length 1 so this is correct; for multi-day weekly the cycle length
      // equals the number of weekdays per week, and replaying from the start
      // produces correct dates because each cycle sums to exactly one week.
      let idx = 0
      return current => {
        const stepMs = cycle[idx]
        idx = (idx + 1) % cycle.length
        return new Date(current.getTime() + stepMs)
      }
    }
    case 'DAILY':
      return current => new Date(current.getTime() + interval * DAY_MS)
    case 'HOURLY':
      return current => new Date(current.getTime() + interval * HOUR_MS)
    case 'MONTHLY':
      return current => {
        const next = new Date(current)
        next.setUTCMonth(next.getUTCMonth() + interval)
        return next
      }
    case 'YEARLY':
      return current => {
        const next = new Date(current)
        next.setUTCFullYear(next.getUTCFullYear() + interval)
        return next
      }
    default:
      return null
  }
}

// Walks the deltas between consecutive materialized dates backwards from the end,
// accumulating until they sum to ~7 days × interval (= one weekly cycle). For
// single-weekday rules that's the most recent delta; for MWF-style multi-day
// rules it's the last 2-3 deltas covering one full week.
function detectWeeklyCycle(materialized: string[], interval: number): number[] {
  const weekMs = interval * 7 * DAY_MS
  if (materialized.length < 2) return [weekMs]

  const dates = materialized.map(d => new Date(d).getTime())
  const deltas: number[] = []
  for (let i = dates.length - 1; i > 0; i--) {
    deltas.unshift(dates[i] - dates[i - 1])
  }

  let accumulated = 0
  const cycle: number[] = []
  for (let i = deltas.length - 1; i >= 0; i--) {
    cycle.unshift(deltas[i])
    accumulated += deltas[i]
    // Tolerance of one day to absorb DST shifts that move occurrences by an hour.
    if (Math.abs(accumulated - weekMs) <= DAY_MS) return cycle
    if (accumulated > weekMs + DAY_MS) {
      // Single delta overshoots a week (e.g. recurrent_dates starts with start_at
      // far in the past followed by a future window). Fall back to the most
      // recent delta and trust the materialized cadence.
      return [deltas[deltas.length - 1]]
    }
  }
  // Materialized dates don't span a full week yet. Use whatever cycle we collected.
  return cycle.length > 0 ? cycle : [weekMs]
}

// Buckets events into one array per visible day, expanding recurrent events into one virtual entry
// per occurrence in `recurrent_dates` that falls on a visible day, and sorts each bucket ascending
// by start_at. For recurrent events `start_at` is the FIRST occurrence (often months in the past),
// so we override start_at/finish_at/live on each virtual entry. Non-recurrent events bucket by their
// own start_at. Tagged tuples cache the parsed start timestamp so the sort comparator skips re-parsing.
function bucketEventsByDay(events: EventEntry[], days: Date[], now: number = Date.now()): EventEntry[][] {
  const tagged: Array<[number, EventEntry]>[] = days.map(() => [])
  // The expansion cap is the END of the last visible day, not its start — otherwise
  // an event whose occurrence falls late on the last visible day would be excluded.
  const lastVisibleDay = days[days.length - 1]
  const expansionCap = lastVisibleDay ? new Date(lastVisibleDay.getTime() + DAY_MS - 1) : null

  for (const event of events) {
    const hasRecurrence = event.recurrent && event.recurrent_dates && event.recurrent_dates.length > 0
    const dates = hasRecurrence && expansionCap ? expandRecurrentDates(event, expansionCap) : [event.start_at]

    for (const dateStr of dates) {
      const start = new Date(dateStr)
      const dayIdx = days.findIndex(day => isSameLocalDay(start, day))
      if (dayIdx < 0) continue

      const startTs = start.getTime()
      let entry: EventEntry
      if (hasRecurrence) {
        const finishTs = startTs + event.duration
        /* eslint-disable @typescript-eslint/naming-convention */
        entry = {
          ...event,
          start_at: start.toISOString(),
          finish_at: new Date(finishTs).toISOString(),
          live: startTs <= now && now <= finishTs
        }
        /* eslint-enable @typescript-eslint/naming-convention */
      } else {
        entry = event
      }
      tagged[dayIdx].push([startTs, entry])
    }
  }

  return tagged.map(bucket => bucket.sort((a, b) => a[0] - b[0]).map(([, e]) => e))
}

function findEventInMap(eventsByCoord: Map<string, EventEntry>, parcels: Array<[number, number]>): EventEntry | undefined {
  for (const [px, py] of parcels) {
    const match = eventsByCoord.get(coordsKey(px, py))
    if (match) return match
  }
  return undefined
}

function isGenesisPlaza(name: string): boolean {
  return name.toLowerCase().includes('genesis plaza')
}

function buildPlazaCard(hotScenes: HotScene[]): LiveNowCard {
  const plaza = hotScenes.find(s => isGenesisPlaza(s.name))
  const plazaCoords = plaza ? coordsKey(plaza.baseCoords[0], plaza.baseCoords[1]) : '0,0'
  return {
    id: plaza?.id ?? 'genesis-plaza',
    type: 'place',
    title: plaza?.name ?? 'Genesis Plaza',
    image: plaza?.thumbnail ?? '',
    users: plaza?.usersTotalCount ?? 0,
    coordinates: plazaCoords,
    creatorName: DCL_FOUNDATION_NAME,
    isGenesisPlaza: true
  }
}

function buildLiveNowCards(liveEvents: EventEntry[], hotScenes: HotScene[], minUsers = DEFAULT_MIN_USERS): LiveNowCard[] {
  const filteredScenes = hotScenes.filter(s => s.usersTotalCount >= minUsers)
  const eventsByCoord = new Map(liveEvents.map(e => [coordsKey(e.x, e.y), e]))
  const cards: LiveNowCard[] = []
  const usedSceneIds = new Set<string>()
  const usedEventIds = new Set<string>()

  for (const scene of filteredScenes) {
    const matchedEvent = findEventInMap(eventsByCoord, scene.parcels)
    if (matchedEvent && !usedEventIds.has(matchedEvent.id)) {
      cards.push({
        id: matchedEvent.id,
        type: 'event',
        title: matchedEvent.name,
        image: matchedEvent.image || '',
        users: scene.usersTotalCount,
        coordinates: coordsKey(matchedEvent.x, matchedEvent.y),
        creatorAddress: matchedEvent.user,
        creatorName: matchedEvent.user_name || undefined,
        isGenesisPlaza: false,
        description: matchedEvent.description,
        categories: matchedEvent.categories,
        startAt: matchedEvent.start_at,
        finishAt: matchedEvent.finish_at,
        recurrent: matchedEvent.recurrent,
        recurrentFrequency: matchedEvent.recurrent_frequency,
        recurrentInterval: matchedEvent.recurrent_interval,
        recurrentWeekdayMask: matchedEvent.recurrent_weekday_mask,
        recurrentCount: matchedEvent.recurrent_count,
        recurrentUntil: matchedEvent.recurrent_until,
        recurrentDates: matchedEvent.recurrent_dates,
        attending: matchedEvent.attending,
        world: matchedEvent.world,
        server: matchedEvent.server
      })
      usedSceneIds.add(scene.id)
      usedEventIds.add(matchedEvent.id)
    }
  }

  cards.sort((a, b) => b.users - a.users)

  const scenesWithoutEvents = filteredScenes.filter(s => !usedSceneIds.has(s.id)).sort((a, b) => b.usersTotalCount - a.usersTotalCount)

  for (const scene of scenesWithoutEvents) {
    const genesis = isGenesisPlaza(scene.name)
    cards.push({
      id: scene.id,
      type: 'place',
      title: scene.name,
      image: scene.thumbnail,
      users: scene.usersTotalCount,
      coordinates: coordsKey(scene.baseCoords[0], scene.baseCoords[1]),
      ...(genesis && { creatorName: DCL_FOUNDATION_NAME }),
      isGenesisPlaza: genesis
    })
  }

  if (cards.length === 0) {
    cards.push(buildPlazaCard(hotScenes))
  }

  return cards
}

// --- Place enrichment types ---

/* eslint-disable @typescript-eslint/naming-convention */
interface PlaceResponse {
  data: {
    description?: string
    categories?: string[]
    owner?: string | null
    contact_name?: string | null
    creator_address?: string | null
  }[]
}
/* eslint-enable @typescript-eslint/naming-convention */

interface EnrichmentConfig {
  placesUrl?: string
  peerUrl?: string
}

const WALLET_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/

// TODO: N+1 optimization — Places API supports comma-separated `positions` param for batch lookups.
// `entities/active` and `deployments` already support batch queries (see `resolveDeployers` in
// `events.discovery.ts` for the batch pattern). Collapse all place-card requests into batch calls.
async function enrichPlaceCards(cards: LiveNowCard[], config: EnrichmentConfig): Promise<LiveNowCard[]> {
  const { placesUrl, peerUrl } = config
  const placeCards = cards.filter(c => c.type === 'place')
  if (placeCards.length === 0) return cards
  if (!placesUrl && !peerUrl) return cards

  const enrichments = new Map<string, Partial<LiveNowCard>>()

  await Promise.all(
    placeCards.map(async card => {
      const patch: Partial<LiveNowCard> = {}

      if (placesUrl) {
        try {
          const qs = new URLSearchParams({ positions: card.coordinates }).toString()
          const res = await fetch(`${placesUrl}/places?${qs}`)
          if (res.ok) {
            const data = (await res.json()) as PlaceResponse
            const place = data.data?.[0]
            if (place) {
              patch.description = place.description || null
              patch.categories = place.categories || []

              const trimmedOwner = place.owner?.trim() || undefined
              const ownerIsWallet = !!trimmedOwner && WALLET_ADDRESS_REGEX.test(trimmedOwner)
              if (!card.creatorAddress) {
                const address = place.creator_address?.trim() || (ownerIsWallet ? trimmedOwner : undefined)
                if (address) patch.creatorAddress = address
              }
              if (!card.creatorName) {
                const name = place.contact_name?.trim() || (trimmedOwner && !ownerIsWallet ? trimmedOwner : undefined)
                if (name) patch.creatorName = name
              }
            }
          }
        } catch (err) {
          console.warn('[LiveNow] places lookup failed for', card.coordinates, err)
        }
      }

      if (peerUrl && !card.creatorAddress && !patch.creatorAddress) {
        try {
          const entityRes = await fetch(`${peerUrl}/content/entities/active`, {
            method: 'POST',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pointers: [card.coordinates] })
          })
          if (entityRes.ok) {
            const entities = (await entityRes.json()) as ActiveEntity[]
            const entityId = entities[0]?.id
            if (entityId) {
              const depRes = await fetch(`${peerUrl}/content/deployments/?entityId=${encodeURIComponent(entityId)}`)
              if (depRes.ok) {
                const depData = (await depRes.json()) as DeploymentResponse
                const deployedBy = depData.deployments?.[0]?.deployedBy
                if (deployedBy) patch.creatorAddress = deployedBy
              }
            }
          }
        } catch (err) {
          console.warn('[LiveNow] deployer lookup failed for', card.coordinates, err)
        }
      }

      if (Object.keys(patch).length > 0) {
        enrichments.set(card.id, patch)
      }
    })
  )

  if (enrichments.size === 0) return cards

  return cards.map(card => {
    const patch = enrichments.get(card.id)
    return patch ? { ...card, ...patch } : card
  })
}

export {
  bucketEventsByDay,
  buildLiveNowCards,
  DCL_FOUNDATION_LOGO_URL,
  DCL_FOUNDATION_NAME,
  enrichPlaceCards,
  expandRecurrentDates,
  isDclFoundationCreator
}
export type { EnrichmentConfig, HotScene, LiveNowCard }
