import { render, screen } from '@testing-library/react'
import { CardsGrid, CenteredRow, EmptyState, LoadMoreRow, SelectPageContainer } from './SelectPage.styled'

jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../__test-utils__/styledMock')
  return { ...actual, Typography: actual.Box }
})

describe('SelectPage styled components', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendering every export', () => {
    it('should mount them all and forward children', () => {
      render(
        <SelectPageContainer>
          <CenteredRow>spinner</CenteredRow>
          <CardsGrid>card</CardsGrid>
          <EmptyState>nothing here</EmptyState>
          <LoadMoreRow>load more</LoadMoreRow>
        </SelectPageContainer>
      )

      expect(screen.getByText('spinner')).toBeInTheDocument()
      expect(screen.getByText('card')).toBeInTheDocument()
      expect(screen.getByText('nothing here')).toBeInTheDocument()
      expect(screen.getByText('load more')).toBeInTheDocument()
    })
  })
})
