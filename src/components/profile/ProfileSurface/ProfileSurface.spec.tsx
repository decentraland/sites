import { render, screen } from '@testing-library/react'
import { ProfileSurface } from './ProfileSurface'

const useProfileAvatarMock = jest.fn()
const useTabletAndBelowMediaQueryMock = jest.fn()

jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children?: React.ReactNode }) => <div data-testid="helmet">{children}</div>
}))

jest.mock('decentraland-ui2', () => ({
  useTabletAndBelowMediaQuery: () => useTabletAndBelowMediaQueryMock()
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

jest.mock('../../../hooks/useProfileAvatar', () => ({
  useProfileAvatar: (address: string | undefined) => useProfileAvatarMock(address)
}))

jest.mock('../../../pages/profile/tabs', () => ({
  AssetsTab: ({ embedded }: { embedded?: boolean }) => <div data-testid="assets-tab" data-embedded={String(Boolean(embedded))} />,
  CommunitiesTab: () => null,
  CreationsTab: ({ embedded }: { embedded?: boolean }) => <div data-testid="creations-tab" data-embedded={String(Boolean(embedded))} />,
  OverviewTab: () => <div data-testid="overview-tab" />,
  PhotosTab: () => null,
  PlacesTab: () => null,
  ReferralRewardsTab: () => null
}))

jest.mock('../AvatarRender', () => ({ AvatarRender: () => null }))
jest.mock('../ProfileHeader', () => ({ ProfileHeader: () => <div data-testid="profile-header" /> }))
jest.mock('../ProfileMobileMenu', () => ({ ProfileMobileNav: () => <div data-testid="mobile-nav" /> }))
jest.mock('./MobileTabHeader', () => ({ MobileTabHeader: () => <div data-testid="mobile-tab-header" /> }))
jest.mock('../ProfileLayout', () => ({
  ProfileLayout: ({ header, children }: { header?: React.ReactNode; children?: React.ReactNode }) => (
    <div>
      {header}
      {children}
    </div>
  )
}))
jest.mock('../ProfileTabs', () => ({
  ProfileTabs: () => <div data-testid="profile-tabs" />,
  getVisibleTabs: () => [{ id: 'overview', labelKey: 'profile.tabs.overview' }],
  isTabAvailable: () => true,
  useProfileTabAvailability: () => ({ hidden: new Set(), isReady: true })
}))

const ADDRESS = '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd'

function renderSurface(props: Partial<React.ComponentProps<typeof ProfileSurface>> = {}) {
  return render(
    <ProfileSurface address={ADDRESS} isOwnProfile={false} activeTab="overview" onTabChange={jest.fn()} manageDocumentTitle {...props} />
  )
}

describe('ProfileSurface', () => {
  beforeEach(() => {
    useTabletAndBelowMediaQueryMock.mockReturnValue(false)
    useProfileAvatarMock.mockReturnValue({ name: undefined, avatar: undefined })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when managing the document title', () => {
    describe('and the profile has a claimed name', () => {
      beforeEach(() => {
        useProfileAvatarMock.mockReturnValue({
          name: 'Brai',
          avatar: { name: 'Brai', hasClaimedName: true, ethAddress: ADDRESS }
        })
      })

      it('should title the document with the bare display name', () => {
        renderSurface()
        expect(screen.getByTestId('helmet')).toHaveTextContent('Brai | Decentraland')
      })
    })

    describe('and the profile name is not claimed', () => {
      beforeEach(() => {
        useProfileAvatarMock.mockReturnValue({
          name: 'Anon',
          avatar: { name: 'Anon', hasClaimedName: false, ethAddress: ADDRESS }
        })
      })

      it('should append the # suffix with the last 4 characters of the address', () => {
        renderSurface()
        expect(screen.getByTestId('helmet')).toHaveTextContent('Anon#0ddd | Decentraland')
      })
    })

    describe('and the profile is still loading or has no name', () => {
      it('should fall back to the generic overview title', () => {
        renderSurface()
        expect(screen.getByTestId('helmet')).toHaveTextContent('profile.tabs.overview | Decentraland')
      })
    })
  })

  describe('when the surface does not manage the document title', () => {
    it('should not render a Helmet at all', () => {
      renderSurface({ manageDocumentTitle: false })
      expect(screen.queryByTestId('helmet')).not.toBeInTheDocument()
    })
  })

  // The preview-bearing tabs lift their hover-preview overlay above the dialog only when
  // the surface is embedded in the profile modal (#588), so `embedded` must reach them.
  describe('when threading the embedded flag to preview tabs', () => {
    it('should mark the assets tab as not embedded on the standalone surface', () => {
      renderSurface({ activeTab: 'assets' })
      expect(screen.getByTestId('assets-tab')).toHaveAttribute('data-embedded', 'false')
    })

    it('should mark the assets tab as embedded inside the modal', () => {
      renderSurface({ activeTab: 'assets', embedded: true })
      expect(screen.getByTestId('assets-tab')).toHaveAttribute('data-embedded', 'true')
    })

    it('should thread embedded to the creations tab as well', () => {
      renderSurface({ activeTab: 'creations', embedded: true })
      expect(screen.getByTestId('creations-tab')).toHaveAttribute('data-embedded', 'true')
    })
  })
})
