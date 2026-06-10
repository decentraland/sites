import { fireEvent, render, screen } from '@testing-library/react'

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({ useFormatMessage: () => (id: string) => id }))

interface PaginationMockProps {
  count: number
  page: number
  rowsPerPage: number
  onPageChange: (event: unknown, page: number) => void
  onRowsPerPageChange: (event: { target: { value: string } }) => void
  rowsPerPageOptions: number[]
}

// Minimal decentraland-ui2 mock — passthrough table primitives plus a
// TablePagination stub that surfaces the current window and exposes prev/next +
// rows-per-page controls so the pager logic can be driven from tests.
jest.mock('decentraland-ui2', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const react = require('react') as typeof import('react')
  type Children = { children?: React.ReactNode }
  const wrap =
    (tag: string) =>
    ({ children }: Children) =>
      react.createElement(tag, null, children)
  return {
    Paper: wrap('div'),
    TableContainer: wrap('div'),
    Table: wrap('table'),
    TableHead: wrap('thead'),
    TableBody: wrap('tbody'),
    TableRow: wrap('tr'),
    TableCell: wrap('td'),
    Typography: wrap('span'),
    IconButton: ({ children, onClick, ...rest }: Children & { onClick?: () => void; ['aria-label']?: string }) =>
      react.createElement('button', { onClick, 'aria-label': rest['aria-label'] }, children),
    TablePagination: ({ count, page, rowsPerPage, onPageChange, onRowsPerPageChange, rowsPerPageOptions }: PaginationMockProps) =>
      react.createElement('div', { 'data-testid': 'pagination' }, [
        react.createElement(
          'span',
          { key: 'info', 'data-testid': 'page-info' },
          `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, count)} of ${count}`
        ),
        react.createElement(
          'button',
          { key: 'prev', 'aria-label': 'prev-page', onClick: (e: unknown) => onPageChange(e, page - 1) },
          'prev'
        ),
        react.createElement(
          'button',
          { key: 'next', 'aria-label': 'next-page', onClick: (e: unknown) => onPageChange(e, page + 1) },
          'next'
        ),
        react.createElement(
          'select',
          { key: 'rpp', 'aria-label': 'rows-per-page', value: rowsPerPage, onChange: onRowsPerPageChange },
          rowsPerPageOptions.map(option => react.createElement('option', { key: option, value: option }, option))
        )
      ])
  }
})

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { KeyTable } = require('./KeyTable') as typeof import('./KeyTable')

const makeKeys = (count: number) => Array.from({ length: count }, (_, i) => ({ key: `k${i}` }))

describe('KeyTable', () => {
  const onEdit = jest.fn()
  const onDelete = jest.fn()

  afterEach(() => jest.resetAllMocks())

  it('should render the empty label when there are no keys', () => {
    render(<KeyTable keys={[]} emptyLabel="nothing here" onEdit={onEdit} onDelete={onDelete} />)
    expect(screen.getByText('nothing here')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('should render a row per key and fire edit/delete callbacks', () => {
    render(<KeyTable keys={[{ key: 'foo' }]} emptyLabel="empty" onEdit={onEdit} onDelete={onDelete} />)
    expect(screen.getByText('foo')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('edit foo'))
    fireEvent.click(screen.getByLabelText('delete foo'))
    expect(onEdit).toHaveBeenCalledWith('foo')
    expect(onDelete).toHaveBeenCalledWith('foo')
  })

  it('should not render the pager for a single page of keys', () => {
    render(<KeyTable keys={makeKeys(10)} emptyLabel="empty" onEdit={onEdit} onDelete={onDelete} />)
    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(10 + 1) // + header row
  })

  it('should paginate keys and show only the first page', () => {
    render(<KeyTable keys={makeKeys(25)} emptyLabel="empty" onEdit={onEdit} onDelete={onDelete} />)
    expect(screen.getByTestId('page-info')).toHaveTextContent('1-10 of 25')
    expect(screen.getByText('k0')).toBeInTheDocument()
    expect(screen.queryByText('k10')).not.toBeInTheDocument()
  })

  it('should advance to the next page', () => {
    render(<KeyTable keys={makeKeys(25)} emptyLabel="empty" onEdit={onEdit} onDelete={onDelete} />)
    fireEvent.click(screen.getByLabelText('next-page'))
    expect(screen.getByTestId('page-info')).toHaveTextContent('11-20 of 25')
    expect(screen.getByText('k10')).toBeInTheDocument()
    expect(screen.queryByText('k0')).not.toBeInTheDocument()
  })

  it('should reset to the first page when the rows-per-page changes', () => {
    render(<KeyTable keys={makeKeys(60)} emptyLabel="empty" onEdit={onEdit} onDelete={onDelete} />)
    fireEvent.click(screen.getByLabelText('next-page'))
    expect(screen.getByTestId('page-info')).toHaveTextContent('11-20 of 60')
    fireEvent.change(screen.getByLabelText('rows-per-page'), { target: { value: '50' } })
    expect(screen.getByTestId('page-info')).toHaveTextContent('1-50 of 60')
  })

  it('should clamp the page back into range when keys shrink', () => {
    const { rerender } = render(<KeyTable keys={makeKeys(25)} emptyLabel="empty" onEdit={onEdit} onDelete={onDelete} />)
    fireEvent.click(screen.getByLabelText('next-page')) // page 1 (11-20)
    fireEvent.click(screen.getByLabelText('next-page')) // page 2 (21-25)
    expect(screen.getByTestId('page-info')).toHaveTextContent('21-25 of 25')
    rerender(<KeyTable keys={makeKeys(11)} emptyLabel="empty" onEdit={onEdit} onDelete={onDelete} />)
    // Page 2 no longer exists (11 keys → pages 0,1); the effect clamps to page 1.
    expect(screen.getByTestId('page-info')).toHaveTextContent('11-11 of 11')
  })
})
