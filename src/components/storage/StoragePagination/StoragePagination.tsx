import type { ChangeEvent, FC, MouseEvent } from 'react'
import { TablePagination } from 'decentraland-ui2'

// Page sizes for the dense key tables vs. the roomier card grids.
const TABLE_PAGE_SIZES = [10, 25, 50]
const GRID_PAGE_SIZES = [12, 24, 48]

interface StoragePaginationProps {
  count: number
  page: number
  rowsPerPage: number
  rowsPerPageOptions: number[]
  onPageChange: (event: MouseEvent<HTMLButtonElement> | null, page: number) => void
  onRowsPerPageChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

// Shared pager for the storage tables and card grids. Stays hidden until the
// list outgrows the smallest page size, so single-page lists keep no chrome.
const StoragePagination: FC<StoragePaginationProps> = props => {
  const { count, page, rowsPerPage, rowsPerPageOptions, onPageChange, onRowsPerPageChange } = props
  if (count <= rowsPerPageOptions[0]) return null
  return (
    <TablePagination
      component="div"
      count={count}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      rowsPerPageOptions={rowsPerPageOptions}
    />
  )
}

export { StoragePagination, TABLE_PAGE_SIZES, GRID_PAGE_SIZES }
export type { StoragePaginationProps }
