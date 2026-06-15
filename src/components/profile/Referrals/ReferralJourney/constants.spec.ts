jest.mock('../../../../utils/assetUrl', () => ({
  assetUrl: (path: string) => `https://cdn.test${path}`
}))

import { TIERS } from './constants'

describe('referral journey TIERS', () => {
  it('should expose the nine reward tiers', () => {
    expect(TIERS).toHaveLength(9)
  })

  // Regression for the broken reward images on CDN deploys: every tier image
  // must resolve through `assetUrl` so it points at the CDN base instead of the
  // page origin.
  it('should resolve every tier image through assetUrl', () => {
    for (const tier of TIERS) {
      expect(tier.image).toMatch(/^https:\/\/cdn\.test\/images\/referrals\/tier_\d\.webp$/)
    }
  })
})
