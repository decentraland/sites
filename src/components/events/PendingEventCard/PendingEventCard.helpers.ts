type TranslateFn = (key: string, values?: Record<string, string | number>) => string

const MS_PER_DAY = 24 * 60 * 60 * 1000

function getRelativeDateLabel(startTime: string | null, t: TranslateFn): string {
  if (!startTime) return ''
  const start = new Date(startTime)
  const now = new Date()

  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const diffDays = Math.round((startMidnight - nowMidnight) / MS_PER_DAY)

  if (diffDays === 0) return t('whats_on_admin.pending_events.today')
  if (diffDays === 1) return t('whats_on_admin.pending_events.tomorrow')
  if (diffDays > 1 && diffDays < 7) return t('whats_on_admin.pending_events.in_n_days', { count: diffDays })

  return start.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }).toUpperCase()
}

type EventStatus = 'pending' | 'approved' | 'rejected'

function getEventStatus(event: { approved: boolean; rejected: boolean }): EventStatus {
  if (event.rejected) return 'rejected'
  if (event.approved) return 'approved'
  return 'pending'
}

export { getEventStatus, getRelativeDateLabel }
export type { EventStatus }
