import { memo, useMemo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useTranslation } from '@dcl/hooks'
import { addDays, formatDayHeader, formatDayHeaderAria } from '../../../utils/whatsOnDate'
import { DateLabel, NavButton, NavigationBar } from './DateNavigation.styled'

interface DateNavigationProps {
  startOffset: number
  columnCount: number
  today: Date
  onNavigateLeft: () => void
  onNavigateRight: () => void
}

const DateNavigation = memo(({ startOffset, columnCount, today, onNavigateLeft, onNavigateRight }: DateNavigationProps) => {
  const { t } = useTranslation()
  const canGoBack = startOffset > 0

  const days = useMemo(
    () => Array.from({ length: columnCount }, (_, i) => addDays(today, startOffset + i)),
    [today, startOffset, columnCount]
  )

  return (
    <NavigationBar role="navigation" aria-label={t('all_experiences.title')}>
      <NavButton
        side="left"
        onClick={onNavigateLeft}
        disabled={!canGoBack}
        aria-label={t('all_experiences.navigate_previous')}
        aria-disabled={!canGoBack}
        tabIndex={canGoBack ? 0 : -1}
      >
        <ChevronLeftIcon sx={{ fontSize: 20 }} />
      </NavButton>
      {days.map((day, i) => (
        <DateLabel
          key={day.toISOString()}
          isToday={startOffset + i === 0}
          aria-label={formatDayHeaderAria(day)}
          aria-current={startOffset + i === 0 ? 'date' : undefined}
        >
          {formatDayHeader(day, t, today)}
        </DateLabel>
      ))}
      <NavButton side="right" onClick={onNavigateRight} aria-label={t('all_experiences.navigate_next')}>
        <ChevronRightIcon sx={{ fontSize: 20 }} />
      </NavButton>
    </NavigationBar>
  )
})

DateNavigation.displayName = 'DateNavigation'

export { DateNavigation }
export type { DateNavigationProps }
