import { render, screen } from '@testing-library/react'
import { BulkActionsRow, RowActionsCell } from './KeyTable.styled'

jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  return { ...actual, TableCell: 'td' }
})

describe('KeyTable styled components', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendering the row actions cell', () => {
    it('should forward its children', () => {
      render(
        <table>
          <tbody>
            <tr>
              <RowActionsCell>actions</RowActionsCell>
            </tr>
          </tbody>
        </table>
      )

      expect(screen.getByText('actions')).toBeInTheDocument()
    })
  })

  describe('when rendering the bulk actions row', () => {
    it('should forward its children', () => {
      render(<BulkActionsRow>bulk</BulkActionsRow>)

      expect(screen.getByText('bulk')).toBeInTheDocument()
    })
  })
})
