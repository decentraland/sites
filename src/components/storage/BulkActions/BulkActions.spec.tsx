import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dialogMockFactory } from '../__test-utils__/dialogMocks'
import { BulkActions } from './BulkActions'
import type { BulkActionsProps } from './BulkActions'

type ExportMenuButtonMockProps = { label: string; variant?: string; busy?: boolean; onSelect: (format: 'json' | 'csv') => void }

jest.mock('@mui/icons-material/Delete', () => ({ __esModule: true, default: () => null }))
jest.mock('@mui/icons-material/DeleteSweep', () => ({ __esModule: true, default: () => null }))
jest.mock('decentraland-ui2', () => dialogMockFactory())
jest.mock('../_shared/ActionIconButton.styled', () => ({ ActionIconButton: jest.requireMock('decentraland-ui2').IconButton }))
jest.mock('../ExportMenuButton', () => ({
  ExportMenuButton: ({ label, variant = 'button', busy = false, onSelect }: ExportMenuButtonMockProps) =>
    React.createElement(
      'button',
      { type: 'button', 'data-variant': variant, 'aria-busy': busy, onClick: () => onSelect('json') },
      `export ${label}`
    )
}))
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string, values?: Record<string, unknown>) => (values ? [key, ...Object.values(values)].join(' ') : key)
}))

describe('BulkActions', () => {
  let props: BulkActionsProps

  beforeEach(() => {
    props = { variant: 'icon', allSelected: false, count: 0, onDelete: jest.fn(), onDownload: jest.fn(), busy: false }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when nothing is selected', () => {
    it('should render nothing', () => {
      const { container } = render(<BulkActions {...props} />)

      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('when one item is selected', () => {
    beforeEach(() => {
      props.count = 1
    })

    it('should label the delete action with the selected count', () => {
      render(<BulkActions {...props} />)

      expect(screen.getByRole('button', { name: 'component.storage.common.delete_selected 1' })).toBeInTheDocument()
    })

    it('should label the download action with the selected count', () => {
      render(<BulkActions {...props} />)

      expect(screen.getByRole('button', { name: 'export component.storage.common.download_selected 1' })).toBeInTheDocument()
    })

    it('should render the download action in the same variant', () => {
      render(<BulkActions {...props} />)

      expect(screen.getByRole('button', { name: /^export / })).toHaveAttribute('data-variant', 'icon')
    })

    describe('and the delete action is clicked', () => {
      it('should call onDelete', async () => {
        render(<BulkActions {...props} />)

        await userEvent.setup().click(screen.getByRole('button', { name: 'component.storage.common.delete_selected 1' }))

        expect(props.onDelete).toHaveBeenCalledTimes(1)
      })
    })

    describe('and a download format is chosen', () => {
      it('should call onDownload with the format', async () => {
        render(<BulkActions {...props} />)

        await userEvent.setup().click(screen.getByRole('button', { name: /^export / }))

        expect(props.onDownload).toHaveBeenCalledWith('json')
      })
    })

    describe('and an export is running', () => {
      beforeEach(() => {
        props.busy = true
      })

      it('should pass the busy state to the download action', () => {
        render(<BulkActions {...props} />)

        expect(screen.getByRole('button', { name: /^export / })).toHaveAttribute('aria-busy', 'true')
      })
    })
  })

  describe('when everything is selected', () => {
    beforeEach(() => {
      props.allSelected = true
      props.count = 3
    })

    it('should label the delete action as delete all', () => {
      render(<BulkActions {...props} />)

      expect(screen.getByRole('button', { name: 'component.storage.common.delete_all' })).toBeInTheDocument()
    })

    it('should label the download action as download all', () => {
      render(<BulkActions {...props} />)

      expect(screen.getByRole('button', { name: 'export component.storage.common.download_all' })).toBeInTheDocument()
    })
  })

  describe('when every item is selected by hand (not server-side all)', () => {
    beforeEach(() => {
      props.count = 3
    })

    it('should label the delete action as delete selected, matching the per-item action', () => {
      render(<BulkActions {...props} />)

      expect(screen.getByRole('button', { name: 'component.storage.common.delete_selected 3' })).toBeInTheDocument()
    })

    it('should label the download action as download selected', () => {
      render(<BulkActions {...props} />)

      expect(screen.getByRole('button', { name: 'export component.storage.common.download_selected 3' })).toBeInTheDocument()
    })
  })

  describe('when there is no download handler', () => {
    beforeEach(() => {
      props.count = 2
      props.onDownload = undefined
    })

    it('should only render the delete action', () => {
      render(<BulkActions {...props} />)

      expect(screen.getAllByRole('button').map(button => button.getAttribute('aria-label') ?? button.textContent)).toEqual([
        'component.storage.common.delete_selected 2'
      ])
    })
  })

  describe('when rendered as buttons', () => {
    beforeEach(() => {
      props.variant = 'button'
      props.count = 2
    })

    it('should show the delete label as button text', () => {
      render(<BulkActions {...props} />)

      expect(screen.getByRole('button', { name: 'component.storage.common.delete_selected 2' })).toHaveTextContent(
        'component.storage.common.delete_selected 2'
      )
    })

    it('should render the download action as a button', () => {
      render(<BulkActions {...props} />)

      expect(screen.getByRole('button', { name: /^export / })).toHaveAttribute('data-variant', 'button')
    })
  })
})
