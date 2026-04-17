import { memo } from 'react'
import type { EventEntry } from '../../../features/explore-events'
import { FutureCard } from './FutureCard'
import { LiveCard } from './LiveCard'

interface AllExperiencesCardProps {
  event: EventEntry
  onClick: (event: EventEntry) => void
}

const AllExperiencesCard = memo(({ event, onClick }: AllExperiencesCardProps) => {
  if (event.live) {
    return <LiveCard event={event} onClick={onClick} />
  }
  return <FutureCard event={event} onClick={onClick} />
})

AllExperiencesCard.displayName = 'AllExperiencesCard'

export { AllExperiencesCard }
export type { AllExperiencesCardProps }
