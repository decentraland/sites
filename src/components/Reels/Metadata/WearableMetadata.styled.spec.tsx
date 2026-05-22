jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))

import { render } from '@testing-library/react'
import {
  BuyButton,
  WearableContainer,
  WearableImage,
  WearableName,
  WearableStaticContainer,
  WearableWrapper
} from './WearableMetadata.styled'

describe('WearableMetadata styled components', () => {
  it('renders every export with prop variants covering rarity, hover, and visibility', () => {
    render(
      <>
        <WearableStaticContainer />
        <WearableContainer href="https://example.test">
          <WearableWrapper hovered>
            <WearableImage rarity="common" />
            <WearableName>Cool</WearableName>
          </WearableWrapper>
          <BuyButton visible>Buy</BuyButton>
        </WearableContainer>
        <WearableContainer href="#">
          <WearableWrapper hovered={false}>
            <WearableImage rarity="epic" />
            <WearableName>Sparkle</WearableName>
          </WearableWrapper>
          <BuyButton visible={false}>Buy</BuyButton>
        </WearableContainer>
        <WearableImage rarity="legendary" />
        <WearableImage rarity="mythic" />
        <WearableImage rarity="rare" />
        <WearableImage rarity="uncommon" />
        <WearableImage rarity="unique" />
      </>
    )
  })
})
