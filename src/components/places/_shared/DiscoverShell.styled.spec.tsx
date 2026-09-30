import { render, screen } from '@testing-library/react'
import { CardGrid, Empty, HeaderRow, PageContent, PageTitle, SearchField } from './index'

// Run the real DiscoverShell.styled.ts through the shared styled shim instead
// of the emotion engine (decentraland-ui2 ships ESM Jest can't transform).
jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  return {
    ...actual,
    Typography: actual.Box,
    TextField: actual.Box,
    dclColors: {
      base: { primary: '#ff2d55', primaryDark1: '#e6284c' },
      neutral: { softWhite: '#fcfcfc', gray5: '#ecebed', gray3: '#a09ba8', softBlack1: '#161518', white: '#ffffff' }
    }
  }
})

describe('DiscoverShell styled components', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendering every export from the barrel', () => {
    it('should mount them all and forward children', () => {
      render(
        <PageContent>
          <HeaderRow>
            <PageTitle>Discover</PageTitle>
            <SearchField />
          </HeaderRow>
          <CardGrid>
            <span>card</span>
          </CardGrid>
          <Empty>Nothing here</Empty>
        </PageContent>
      )

      expect(screen.getByText('Discover')).toBeInTheDocument()
      expect(screen.getByText('card')).toBeInTheDocument()
      expect(screen.getByText('Nothing here')).toBeInTheDocument()
    })
  })
})
