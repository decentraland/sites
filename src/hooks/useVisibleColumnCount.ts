import { useEffect, useState } from 'react'

/** Must match the number of useDayQuery calls in useAllExperiencesData */
const MAX_COLUMNS = 5

const BREAKPOINTS = [
  { query: '(min-width: 1536px)', columns: MAX_COLUMNS },
  { query: '(min-width: 1200px)', columns: 4 },
  { query: '(min-width: 900px)', columns: 3 },
  { query: '(min-width: 600px)', columns: 2 }
] as const

function getColumnCount(): number {
  for (const { query, columns } of BREAKPOINTS) {
    if (window.matchMedia(query).matches) {
      return columns
    }
  }
  return 1
}

function useVisibleColumnCount(): number {
  const [columnCount, setColumnCount] = useState(getColumnCount)

  useEffect(() => {
    const mediaQueryLists = BREAKPOINTS.map(({ query }) => window.matchMedia(query))

    const handleChange = () => {
      setColumnCount(getColumnCount())
    }

    for (const mql of mediaQueryLists) {
      mql.addEventListener('change', handleChange)
    }

    return () => {
      for (const mql of mediaQueryLists) {
        mql.removeEventListener('change', handleChange)
      }
    }
  }, [])

  return columnCount
}

export { MAX_COLUMNS, useVisibleColumnCount }
