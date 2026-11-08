import { render, screen } from '@testing-library/react'
import { dialogMockFactory } from '../__test-utils__/dialogMocks'
import { BulkDeleteDialog } from './BulkDeleteDialog'
import type { BulkDeleteDialogProps } from './BulkDeleteDialog'

jest.mock('decentraland-ui2', () => dialogMockFactory())
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string, values?: Record<string, unknown>) => (values ? [key, ...Object.values(values)].join(' ') : key)
}))

describe('BulkDeleteDialog', () => {
  let props: BulkDeleteDialogProps

  beforeEach(() => {
    props = {
      open: true,
      pending: false,
      allSelected: false,
      count: 3,
      clearTitle: 'Clear all',
      clearMessage: 'Clear everything',
      onConfirm: jest.fn(),
      onCancel: jest.fn()
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when only some rows are selected', () => {
    it('should show the delete-selected copy with the count', () => {
      render(<BulkDeleteDialog {...props} />)

      expect(screen.getByText('component.storage.common.delete_selected_dialog.title')).toBeInTheDocument()
      expect(screen.getByText('component.storage.common.delete_selected_dialog.message 3')).toBeInTheDocument()
    })
  })

  describe('when everything is selected', () => {
    it('should show the clear copy', () => {
      render(<BulkDeleteDialog {...props} allSelected />)

      expect(screen.getByText('Clear all')).toBeInTheDocument()
      expect(screen.getByText('Clear everything')).toBeInTheDocument()
    })
  })
})
