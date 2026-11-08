import { render, screen } from '@testing-library/react'
import { ActionIconButton } from './ActionIconButton.styled'

jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  return { ...actual, IconButton: 'button' }
})

describe('ActionIconButton', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when it renders', () => {
    it('should forward its accessible name', () => {
      render(<ActionIconButton aria-label="delete gameState" />)

      expect(screen.getByRole('button', { name: 'delete gameState' })).toBeInTheDocument()
    })
  })
})
