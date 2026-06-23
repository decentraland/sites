import { ALL_PROFILE_TABS, getVisibleTabs, isTabAvailable } from './ProfileTabs.types'

describe('ProfileTabs.types', () => {
  describe('getVisibleTabs', () => {
    describe('when the viewer is a member (not the owner)', () => {
      it('should expose the 5 public tabs with their member labels and omit the owner-only tabs', () => {
        const tabs = getVisibleTabs(false)

        expect(tabs.map(tab => tab.id)).toEqual(['overview', 'creations', 'communities', 'places', 'photos'])
        // Member labels (no MY prefix); Creations is member-only.
        expect(tabs.find(tab => tab.id === 'creations')?.labelKey).toBe('profile.tabs.creations')
        expect(tabs.some(tab => tab.id === 'assets')).toBe(false)
        expect(tabs.some(tab => tab.id === 'referral-rewards')).toBe(false)
      })
    })

    describe('when the viewer is the owner', () => {
      it('should expose the 6 owner tabs with MY labels and omit the member-only Creations tab', () => {
        const tabs = getVisibleTabs(true)

        expect(tabs.map(tab => tab.id)).toEqual(['overview', 'assets', 'communities', 'places', 'photos', 'referral-rewards'])
        expect(tabs.find(tab => tab.id === 'assets')?.labelKey).toBe('profile.tabs.my_assets')
        expect(tabs.some(tab => tab.id === 'creations')).toBe(false)
      })
    })
  })

  describe('isTabAvailable', () => {
    describe('when the tab is visible for the viewer', () => {
      it('should return true for a shared tab regardless of ownership', () => {
        expect(isTabAvailable('overview', false)).toBe(true)
        expect(isTabAvailable('overview', true)).toBe(true)
      })

      it('should return true for an owner-only tab when viewing the own profile', () => {
        expect(isTabAvailable('assets', true)).toBe(true)
        expect(isTabAvailable('referral-rewards', true)).toBe(true)
      })

      it('should return true for the member-only Creations tab on a member profile', () => {
        expect(isTabAvailable('creations', false)).toBe(true)
      })
    })

    describe('when the tab is not visible for the viewer', () => {
      it('should return false for an owner-only tab on a member profile', () => {
        expect(isTabAvailable('assets', false)).toBe(false)
        expect(isTabAvailable('referral-rewards', false)).toBe(false)
      })

      it('should return false for the member-only Creations tab on the own profile', () => {
        expect(isTabAvailable('creations', true)).toBe(false)
      })
    })
  })

  describe('ALL_PROFILE_TABS', () => {
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
})
