import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface Selection {
  selected: ReadonlySet<string>
  allSelected: boolean
  count: number
  isSelected: (id: string) => boolean
  toggle: (id: string) => void
  toggleAll: () => void
  toggleVisible: (visibleIds: ReadonlyArray<string>) => void
  clear: () => void
}

interface SelectionState {
  all: boolean
  ids: ReadonlySet<string>
}

const EMPTY: SelectionState = { all: false, ids: new Set() }

const effectiveIds = (state: SelectionState, loaded: ReadonlyArray<string>): Set<string> =>
  new Set(state.all ? loaded : loaded.filter(id => state.ids.has(id)))

/** Gmail-style row selection over the loaded `ids`. */
function useSelection(ids: ReadonlyArray<string>): Selection {
  const [state, setState] = useState<SelectionState>(EMPTY)
  const idsRef = useRef(ids)

  useEffect(() => {
    idsRef.current = ids
  }, [ids])

  const selected = useMemo(() => effectiveIds(state, ids), [state, ids])

  const isSelected = useCallback((id: string) => selected.has(id), [selected])

  const toggle = useCallback((id: string) => {
    setState(prev => {
      const next = effectiveIds(prev, idsRef.current)
      if (!next.delete(id)) next.add(id)
      return { all: false, ids: next }
    })
  }, [])

  const toggleAll = useCallback(() => {
    setState(prev => {
      const loaded = idsRef.current
      const everyLoadedSelected = loaded.length > 0 && loaded.every(id => prev.ids.has(id))
      return prev.all || everyLoadedSelected ? EMPTY : { all: true, ids: new Set() }
    })
  }, [])

  const toggleVisible = useCallback((visibleIds: ReadonlyArray<string>) => {
    setState(prev => {
      const next = effectiveIds(prev, idsRef.current)
      const everyVisibleSelected = visibleIds.every(id => next.has(id))
      visibleIds.forEach(id => (everyVisibleSelected ? next.delete(id) : next.add(id)))
      return { all: false, ids: next }
    })
  }, [])

  const clear = useCallback(() => setState(EMPTY), [])

  return { selected, allSelected: state.all, count: selected.size, isSelected, toggle, toggleAll, toggleVisible, clear }
}

export { useSelection }
export type { Selection }
