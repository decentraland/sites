import { render, screen } from '@testing-library/react'
import { StorageEmptyState } from './StorageEmptyState'

jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  return { ...actual, Paper: actual.Box, Typography: actual.Box }
})

describe('StorageEmptyState', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when it renders', () => {
    it('should show the label', () => {
      render(<StorageEmptyState label="No players found" />)

      expect(screen.getByText('No players found')).toBeInTheDocument()
    })
  })
})
