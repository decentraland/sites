import { memo } from 'react'
import { useTranslation } from '@dcl/hooks'
import type { EventEntry } from '../../../features/events'
import { PendingEventCard } from '../PendingEventCard'
import { CardGrid, GridPanel, GridTitle } from './MyExperiencesGrid.styled'

interface MyExperiencesGridProps {
  events: EventEntry[]
  onCardClick: (event: EventEntry) => void
}

const MyExperiencesGrid = memo(function MyExperiencesGrid({ events, onCardClick }: MyExperiencesGridProps) {
  const { t } = useTranslation()

  return (
    <GridPanel>
      <GridTitle variant="h6">{t('my_hangouts.hosted_by_me')}</GridTitle>
      <CardGrid>
        {events.map(event => (
          <PendingEventCard key={event.id} event={event} onClick={onCardClick} />
        ))}
      </CardGrid>
    </GridPanel>
  )
})

export { MyExperiencesGrid }
export type { MyExperiencesGridProps }
