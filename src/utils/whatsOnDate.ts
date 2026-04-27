type TranslateFn = (key: string, values?: Record<string, string | number>) => string

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function endOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}

function getDayRange(date: Date): { from: string; to: string } {
  return {
    from: startOfDay(date).toISOString(),
    to: endOfDay(date).toISOString()
  }
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatDayHeader(date: Date, t: TranslateFn, today: Date = new Date()): string {
  if (isSameLocalDay(date, today)) {
    return t('all_hangouts.today')
  }

  const tomorrow = addDays(today, 1)
  if (isSameLocalDay(date, tomorrow)) {
    return t('all_hangouts.tomorrow')
  }

  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' })
  const month = date.toLocaleDateString(undefined, { month: 'short' })
  const day = date.getDate()

  return `${weekday}, ${month} ${day}`
}

function formatDayHeaderAria(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export { addDays, endOfDay, formatDayHeader, formatDayHeaderAria, getDayRange, isSameLocalDay, startOfDay }
export type { TranslateFn }
