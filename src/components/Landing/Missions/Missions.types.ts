import { ContentfulMissionsEntriesProps } from '../../../features/landing/landing.types'
import { SegmentEvent } from '../../../modules/segment'

enum MissionType {
  CREATE = 'create',
  EXPERIENCE = 'experience',
  INFLUENCE = 'influence'
}

type MissionsProps = ContentfulMissionsEntriesProps & {
  eventData: SegmentEvent
  isDesktop: boolean
  index?: number
}

type MissionsDetailProps = ContentfulMissionsEntriesProps & {
  isSectionInView: boolean
  isLoggedIn?: boolean
}

type MissionViewProps = {
  onIsInView: () => void
  id: string
}

export type { MissionsDetailProps, MissionsProps, MissionViewProps }
export { MissionType }
