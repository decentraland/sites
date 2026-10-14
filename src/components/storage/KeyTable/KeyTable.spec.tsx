import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KeyTable } from './KeyTable'

type ChildrenProps = { children?: ReactNode }
type IconButtonProps = ChildrenProps & { onClick?: () => void; 'aria-label'?: string }

jest.mock('@mui/icons-material/Delete', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/Download', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/Edit', () => ({ __esModule: true, default: () => <span /> }))

jest.mock('decentraland-ui2', () => ({
  IconButton: ({ children, onClick, 'aria-label': ariaLabel }: IconButtonProps) => (
    <button type="button" aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  ),
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
})
