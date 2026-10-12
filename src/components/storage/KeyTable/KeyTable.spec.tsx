import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dialogMockFactory } from '../__test-utils__/dialogMocks'
import { KeyTable } from './KeyTable'

type ChildrenProps = { children?: ReactNode }

jest.mock('@mui/icons-material/Delete', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/Download', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/Edit', () => ({ __esModule: true, default: () => <span /> }))

jest.mock('decentraland-ui2', () => ({
  ...dialogMockFactory(),
  Paper: ({ children }: ChildrenProps) => <div>{children}</div>,
  Table: ({ children }: ChildrenProps) => <table>{children}</table>,
  TableBody: ({ children }: ChildrenProps) => <tbody>{children}</tbody>,
  TableCell: ({ children }: ChildrenProps) => <td>{children}</td>,
  TableContainer: ({ children }: ChildrenProps) => <div>{children}</div>,
  TableHead: ({ children }: ChildrenProps) => <thead>{children}</thead>,
  TableRow: ({ children }: ChildrenProps) => <tr>{children}</tr>,
  Typography: ({ children }: ChildrenProps) => <p>{children}</p>
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

describe('KeyTable', () => {
  let onEdit: jest.Mock
  let onDelete: jest.Mock
  let onDownload: jest.Mock

  beforeEach(() => {
    onEdit = jest.fn()
    onDelete = jest.fn()
    onDownload = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when there are no keys', () => {
    it('should render the empty label', () => {
      render(<KeyTable keys={[]} emptyLabel="Nothing here" onEdit={onEdit} onDelete={onDelete} />)

      expect(screen.getByText('Nothing here')).toBeInTheDocument()
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  describe('when there are keys', () => {
    it('should call onEdit and onDelete with the row key', async () => {
      const user = userEvent.setup()
      render(<KeyTable keys={[{ key: 'gameState' }]} emptyLabel="" onEdit={onEdit} onDelete={onDelete} />)

      await user.click(screen.getByRole('button', { name: 'edit gameState' }))
      await user.click(screen.getByRole('button', { name: 'delete gameState' }))

      expect(onEdit).toHaveBeenCalledWith('gameState')
      expect(onDelete).toHaveBeenCalledWith('gameState')
    })

    it('should not render a download button without onDownload', () => {
      render(<KeyTable keys={[{ key: 'gameState' }]} emptyLabel="" onEdit={onEdit} onDelete={onDelete} />)

      expect(screen.queryByRole('button', { name: 'download gameState' })).not.toBeInTheDocument()
    })

    it('should call onDownload with the row key', async () => {
      const user = userEvent.setup()
      render(<KeyTable keys={[{ key: 'feedback-1.csv' }]} emptyLabel="" onEdit={onEdit} onDelete={onDelete} onDownload={onDownload} />)

      await user.click(screen.getByRole('button', { name: 'download feedback-1.csv' }))

      expect(onDownload).toHaveBeenCalledWith('feedback-1.csv')
    })
  })

  describe('when selection props are not provided', () => {
    it('should not render any checkbox', () => {
      render(<KeyTable keys={[{ key: 'gameState' }]} emptyLabel="" onEdit={onEdit} onDelete={onDelete} />)

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })
  })

  describe('when selection props are provided', () => {
    let keys: { key: string }[]
    let selected: Set<string>
    let allSelected: boolean
    let onToggle: jest.Mock
    let onToggleAll: jest.Mock

    const renderTable = () =>
      render(
        <KeyTable
          keys={keys}
          emptyLabel=""
          onEdit={onEdit}
          onDelete={onDelete}
          selected={selected}
          allSelected={allSelected}
          onToggle={onToggle}
          onToggleAll={onToggleAll}
        />
      )
    const selectAll = () => screen.getByRole('checkbox', { name: 'component.storage.common.select_all' })
    const rowCheckboxes = () => screen.getAllByRole('checkbox', { name: 'component.storage.common.select_row' })

    beforeEach(() => {
      keys = [{ key: 'gameState' }, { key: 'score' }]
      selected = new Set()
      allSelected = false
      onToggle = jest.fn()
      onToggleAll = jest.fn()
    })

    it('should render a select checkbox on every row', () => {
      renderTable()

      expect(rowCheckboxes()).toHaveLength(2)
    })

    it('should render a select all checkbox in the header', () => {
      renderTable()

      expect(selectAll()).toBeInTheDocument()
    })

    it('should keep the row action buttons labelled by key', () => {
      renderTable()

      expect(screen.getByRole('button', { name: 'edit gameState' })).toBeInTheDocument()
    })

    describe('and a row checkbox is clicked', () => {
      it('should call onToggle with the row key', async () => {
        const user = userEvent.setup()
        renderTable()

        await user.click(rowCheckboxes()[1])

        expect(onToggle).toHaveBeenCalledWith('score')
      })
    })

    describe('and the header checkbox is clicked', () => {
      it('should call onToggleAll', async () => {
        const user = userEvent.setup()
        renderTable()

        await user.click(selectAll())

        expect(onToggleAll).toHaveBeenCalled()
      })
    })

    describe('and nothing is selected', () => {
      it('should render the header neither checked nor indeterminate', () => {
        renderTable()

        expect(selectAll()).not.toBeChecked()
        expect(selectAll()).toHaveAttribute('data-indeterminate', 'false')
      })
    })

    describe('and some rows are selected', () => {
      beforeEach(() => {
        selected = new Set(['score'])
      })

      it('should render the header as indeterminate and unchecked', () => {
        renderTable()

        expect(selectAll()).not.toBeChecked()
        expect(selectAll()).toHaveAttribute('data-indeterminate', 'true')
      })

      it('should check only the selected rows', () => {
        renderTable()

        expect(rowCheckboxes().map(box => (box as HTMLInputElement).checked)).toEqual([false, true])
      })
    })

    describe('and every row is selected', () => {
      beforeEach(() => {
        selected = new Set(['gameState', 'score'])
      })

      it('should render the header as checked and not indeterminate', () => {
        renderTable()

        expect(selectAll()).toBeChecked()
        expect(selectAll()).toHaveAttribute('data-indeterminate', 'false')
      })
    })

    describe('and allSelected is true', () => {
      beforeEach(() => {
        allSelected = true
      })

      it('should render the header as checked', () => {
        renderTable()

        expect(selectAll()).toBeChecked()
      })

      it('should render every row as checked', () => {
        renderTable()

        expect(rowCheckboxes().every(box => (box as HTMLInputElement).checked)).toBe(true)
      })
    })
  })
})
