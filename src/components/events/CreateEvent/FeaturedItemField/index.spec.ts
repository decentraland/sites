jest.mock('./FeaturedItemField', () => ({ FeaturedItemField: () => null }))

import * as featuredItemFieldIndex from './index'

describe('FeaturedItemField barrel', () => {
  it('should re-export the field component', () => {
    expect(featuredItemFieldIndex.FeaturedItemField).toBeDefined()
  })
})
