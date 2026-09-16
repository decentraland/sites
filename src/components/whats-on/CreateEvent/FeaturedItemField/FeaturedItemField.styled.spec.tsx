jest.mock('decentraland-ui2', () => jest.requireActual('../../../../__test-utils__/styledMock'))

import { render, screen } from '@testing-library/react'
import {
  FeaturedAssetCreator,
  FeaturedAssetGroup,
  FeaturedAssetGroupItems,
  FeaturedAssetGroupLabel,
  FeaturedAssetListbox,
  FeaturedAssetName,
  FeaturedAssetPaper,
  FeaturedAssetRow,
  FeaturedAssetTexts,
  SelectedAssetAdornment
} from './FeaturedItemField.styled'

describe('FeaturedItemField.styled', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the dropdown surface is rendered', () => {
    it('should mount the paper, listbox, group and row wrappers', () => {
      render(
        <FeaturedAssetPaper data-testid="paper">
          <FeaturedAssetListbox data-testid="listbox">
            <FeaturedAssetGroup data-testid="group">
              <FeaturedAssetGroupLabel>Items</FeaturedAssetGroupLabel>
              <FeaturedAssetGroupItems data-testid="group-items">
                <FeaturedAssetRow data-testid="row">
                  <FeaturedAssetTexts>
                    <FeaturedAssetName>Reindeer Hat</FeaturedAssetName>
                    <FeaturedAssetCreator>By MetaTiger</FeaturedAssetCreator>
                  </FeaturedAssetTexts>
                </FeaturedAssetRow>
              </FeaturedAssetGroupItems>
            </FeaturedAssetGroup>
          </FeaturedAssetListbox>
        </FeaturedAssetPaper>
      )

      expect(screen.getByTestId('paper')).toBeInTheDocument()
      expect(screen.getByTestId('listbox')).toBeInTheDocument()
      expect(screen.getByTestId('group-items')).toBeInTheDocument()
      expect(screen.getByText('Items')).toBeInTheDocument()
      expect(screen.getByText('Reindeer Hat')).toBeInTheDocument()
      expect(screen.getByText('By MetaTiger')).toBeInTheDocument()
    })
  })

  describe('when a value is selected', () => {
    it('should render the input adornment wrapper', () => {
      render(<SelectedAssetAdornment data-testid="adornment">thumb</SelectedAssetAdornment>)

      expect(screen.getByTestId('adornment')).toHaveTextContent('thumb')
    })
  })
})
