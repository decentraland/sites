import { ALL_PROFILE_TABS, getVisibleTabs, isTabAvailable } from './ProfileTabs.types'
import type { ProfileTabConfig } from './ProfileTabs.types'

describe('when getting the visible tabs', () => {
  let tabs: ProfileTabConfig[]

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the viewer is a member (not the owner)', () => {
    beforeEach(() => {
      tabs = getVisibleTabs(false)
    })

    it('should expose the 5 public tabs in order', () => {
      expect(tabs.map(tab => tab.id)).toEqual(['overview', 'creations', 'communities', 'places', 'photos'])
    })

    it('should label the member-only Creations tab without the MY prefix', () => {
      expect(tabs.find(tab => tab.id === 'creations')?.labelKey).toBe('profile.tabs.creations')
    })

    it('should omit the owner-only Assets tab', () => {
      expect(tabs.some(tab => tab.id === 'assets')).toBe(false)
    })

    it('should omit the owner-only Referral tab', () => {
      expect(tabs.some(tab => tab.id === 'referral-rewards')).toBe(false)
    })
  })

  describe('and the viewer is the owner', () => {
    beforeEach(() => {
      tabs = getVisibleTabs(true)
    })

    it('should expose the 6 owner tabs in order', () => {
      expect(tabs.map(tab => tab.id)).toEqual(['overview', 'assets', 'communities', 'places', 'photos', 'referral-rewards'])
    })

    it('should label the Assets tab with the MY prefix', () => {
      expect(tabs.find(tab => tab.id === 'assets')?.labelKey).toBe('profile.tabs.my_assets')
    })

    it('should omit the member-only Creations tab', () => {
      expect(tabs.some(tab => tab.id === 'creations')).toBe(false)
    })
  })
})

describe('when checking whether a tab is available', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the tab is visible for the viewer', () => {
    it('should return true for a shared tab on a member profile', () => {
      expect(isTabAvailable('overview', false)).toBe(true)
    })

    it('should return true for a shared tab on the own profile', () => {
      expect(isTabAvailable('overview', true)).toBe(true)
    })

    it('should return true for the Assets tab on the own profile', () => {
      expect(isTabAvailable('assets', true)).toBe(true)
    })

    it('should return true for the Referral tab on the own profile', () => {
      expect(isTabAvailable('referral-rewards', true)).toBe(true)
    })

    it('should return true for the member-only Creations tab on a member profile', () => {
      expect(isTabAvailable('creations', false)).toBe(true)
    })
  })

  describe('and the tab is not visible for the viewer', () => {
    it('should return false for the Assets tab on a member profile', () => {
      expect(isTabAvailable('assets', false)).toBe(false)
    })

    it('should return false for the Referral tab on a member profile', () => {
      expect(isTabAvailable('referral-rewards', false)).toBe(false)
    })

    it('should return false for the member-only Creations tab on the own profile', () => {
      expect(isTabAvailable('creations', true)).toBe(false)
    })
  })
})

describe('when reading the canonical tab config list', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should expose the canonical tab order as a stable config list', () => {
    expect(ALL_PROFILE_TABS.map(tab => tab.id)).toEqual([
      'overview',
      'assets',
      'creations',
      'communities',
      'places',
      'photos',
      'referral-rewards'
    ])
  })
})
