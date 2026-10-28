import type { ExploreItem } from '../../../features/events/events.discovery.types'

type HomeDetailSelection = { kind: 'event'; id: string } | { kind: 'place'; item: ExploreItem }

export type { HomeDetailSelection }
