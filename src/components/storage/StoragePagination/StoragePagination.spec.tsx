import { fireEvent, render, screen } from '@testing-library/react'

jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/creatorsUi2Mock'))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { StoragePagination, GRID_PAGE_SIZES, TABLE_PAGE_SIZES } = require('./StoragePagination') as typeof import('./StoragePagination')

describe('StoragePagination', () => {
  const onPageChange = jest.fn()
  const onRowsPerPageChange = jest.fn()
  const baseProps = {
    page: 0,
    rowsPerPage: 10,
    rowsPerPageOptions: TABLE_PAGE_SIZES,
    onPageChange,
    onRowsPerPageChange
  }

  afterEach(() => jest.resetAllMocks())

  it('should expose the page-size constants', () => {
    expect(TABLE_PAGE_SIZES).toEqual([10, 25, 50])
    expect(GRID_PAGE_SIZES).toEqual([12, 24, 48])
  })

  describe('when the count fits the smallest page size', () => {
    it('should render nothing', () => {
      const { container } = render(<StoragePagination {...baseProps} count={10} />)
      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('when the count outgrows the smallest page size', () => {
    it('should render the pager window', () => {
      render(<StoragePagination {...baseProps} count={25} />)
      expect(screen.getByTestId('page-info')).toHaveTextContent('1-10 of 25')
    })

    it('should forward page changes', () => {
      render(<StoragePagination {...baseProps} count={25} />)
      fireEvent.click(screen.getByLabelText('next-page'))
      expect(onPageChange).toHaveBeenCalledWith(expect.anything(), 1)
    })

    it('should forward rows-per-page changes', () => {
      render(<StoragePagination {...baseProps} count={25} />)
      fireEvent.change(screen.getByLabelText('rows-per-page'), { target: { value: '25' } })
      expect(onRowsPerPageChange).toHaveBeenCalled()
    })
  })
})
