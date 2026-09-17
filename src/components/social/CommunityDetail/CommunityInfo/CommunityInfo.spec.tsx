import { render, screen } from '@testing-library/react'
import { Privacy, Role, Visibility } from '../../../../features/communities/communities.types'
import type { Community } from '../../../../features/communities/communities.types'
import { useProfileAvatar } from '../../../../hooks/useProfileAvatar'
import { CommunityInfo } from './CommunityInfo'

jest.mock('@dcl/hooks', () => ({ useAnalytics: () => ({ track: jest.fn() }) }))
jest.mock('@mui/icons-material/Check', () => () => null)
jest.mock('@mui/icons-material/GroupsOutlined', () => () => null)
jest.mock('decentraland-ui2/dist/utils/colors', () => ({ hexToRgba: () => 'rgba(0, 0, 0, 0.3)' }))
jest.mock('decentraland-ui2', () => {
  // The shared shim runs `CommunityInfo.styled.ts` for real instead of stubbing it away.
  const { createUi2Mock } = jest.requireActual('../../../../__test-utils__/ui2Mock')
  const ui2 = createUi2Mock()
  return {
    ...ui2,
    Avatar: ({ src }: { src?: string }) => <img alt="" src={src} />,
    Button: ({ children, onClick, disabled }: { children?: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
      <button onClick={onClick} disabled={disabled}>
        {children}
      </button>
    ),
    useTheme: () => ui2.fakeTheme,
    useTabletAndBelowMediaQuery: () => false,
    useTabletMediaQuery: () => false
  }
})
jest.mock('../../../../config/env', () => ({ getEnv: () => undefined }))
jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({ useFormatMessage: () => (id: string) => id }))
jest.mock('../../../../hooks/useProfileAvatar', () => ({ useProfileAvatar: jest.fn() }))
jest.mock('../../../../utils/authRedirect', () => ({ redirectToAuth: jest.fn() }))
jest.mock('./CommunityJumpInButton', () => ({ CommunityJumpInButton: () => null }))
jest.mock('./PrivacyIcon', () => ({ PrivacyIcon: () => null }))

const mockedUseProfileAvatar = jest.mocked(useProfileAvatar)

const OWNER_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'

const buildCommunity = (): Community => ({
  id: 'c-1',
  name: 'a community',
  description: 'about it',
  ownerAddress: OWNER_ADDRESS,
  privacy: Privacy.PUBLIC,
  visibility: Visibility.ALL,
  active: true,
  membersCount: 3,
  role: Role.NONE
})

const ownerProfile = (overrides: Partial<ReturnType<typeof useProfileAvatar>>): ReturnType<typeof useProfileAvatar> => ({
  avatar: undefined,
  avatarForCard: undefined,
  avatarFace: undefined,
  name: undefined,
  backgroundColor: '#ffffff',
  isLoading: false,
  ...overrides
})

function renderCommunityInfo() {
  return render(
    <CommunityInfo
      community={buildCommunity()}
      isLoggedIn={false}
      isPerformingCommunityAction={false}
      isMember={false}
      canViewContent
      onJoin={jest.fn()}
    />
  )
}

describe('CommunityInfo', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the owner profile is still loading', () => {
    beforeEach(() => {
      mockedUseProfileAvatar.mockReturnValue(ownerProfile({ isLoading: true }))
    })

    it('should hold the owner row with a skeleton for the face and one for the name', () => {
      renderCommunityInfo()

      expect(screen.getAllByRole('progressbar')).toHaveLength(2)
    })

    it('should not paint a placeholder name before the lookup settles', () => {
      renderCommunityInfo()

      expect(screen.queryByText('0x1234…5678')).not.toBeInTheDocument()
    })
  })

  describe('when the owner profile resolved with a name', () => {
    beforeEach(() => {
      mockedUseProfileAvatar.mockReturnValue(ownerProfile({ name: 'alice', avatarFace: 'https://cdn.test/alice.png' }))
    })

    it('should credit the owner by name', () => {
      renderCommunityInfo()

      expect(screen.getByText('alice')).toBeInTheDocument()
    })

    it('should take the skeletons down', () => {
      renderCommunityInfo()

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })
  })

  describe('when the owner has no name to show', () => {
    beforeEach(() => {
      mockedUseProfileAvatar.mockReturnValue(ownerProfile({ name: undefined }))
    })

    it('should fall back to the truncated owner address rather than a generic label', () => {
      renderCommunityInfo()

      expect(screen.getByText('0x1234…5678')).toBeInTheDocument()
    })
  })
})
