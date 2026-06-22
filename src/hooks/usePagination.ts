import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'

interface Pagination<T> {
  page: number
  rowsPerPage: number
  paginated: T[]
  onPageChange: (event: unknown, nextPage: number) => void
  onRowsPerPageChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

// Client-side pagination for in-memory lists, shared by the storage tables and card grids.
function usePagination<T>(items: T[], defaultRowsPerPage = 10): Pagination<T> {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage)

  // Clamp back into range when the list shrinks (deleting the last row on the final
  // page, a search narrowing results) so we never land on an empty page.
  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(items.length / rowsPerPage) - 1)
    if (page > lastPage) setPage(lastPage)
  }, [items.length, rowsPerPage, page])

  const paginated = useMemo(() => items.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [items, page, rowsPerPage])

  const onPageChange = useCallback((_event: unknown, nextPage: number) => setPage(nextPage), [])
  const onRowsPerPageChange = useCallback((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }, [])

  return { page, rowsPerPage, paginated, onPageChange, onRowsPerPageChange }
}

export { usePagination }
export type { Pagination }
