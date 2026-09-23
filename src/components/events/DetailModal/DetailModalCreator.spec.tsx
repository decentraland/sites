import { render, screen } from '@testing-library/react'
import { DetailModalCreator } from './DetailModalCreator'

const mockUseCreatorProfile = jest.fn()
jest.mock('../../../hooks/useCreatorProfile', () => ({
  useCreatorProfile: (...args: unknown[]) => mockUseCreatorProfile(...(args as []))
}))

jest.mock('./DetailModal.styled', () => ({
  CreatorRow: ({ children }: { children: React.ReactNode }) => <div data-testid="creator-row">{children}</div>,
  CreatorButton: ({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button data-testid="creator-button" type="button" {...rest}>
      {children}
    </button>
  ),
  AvatarImage: ({ fallbackColor, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fallbackColor?: string }) => (
    <img data-testid="avatar-image" data-fallback-color={fallbackColor ?? ''} {...props} />
  ),
  AvatarFallback: ({ fallbackColor }: { fallbackColor?: string }) => (
    <div data-testid="avatar-fallback" data-fallback-color={fallbackColor ?? ''} />
  ),
  CreatorName: ({ children }: { children: React.ReactNode }) => <span data-testid="creator-name">{children}</span>,
  CreatorNameHighlight: ({ children }: { children: React.ReactNode }) => <strong>{children}</strong>
}))

const mockOpenProfile = jest.fn()
jest.mock('../../profile/ProfileModal/useOpenProfileModal', () => ({
  useOpenProfileModal: () => mockOpenProfile
}))

describe('DetailModalCreator', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the creator profile resolves with both name and avatar', () => {
    beforeEach(() => {
      mockUseCreatorProfile.mockReturnValue({
        isDclFoundation: false,
        creatorName: 'CreatorName',
        avatarFace: 'https://example.com/face.png',
        backgroundColor: '#abcdef'
      })
    })

    it('should render the creator as a clickable button with the avatar image and name', () => {
      render(<DetailModalCreator address="0xCreator" name="CreatorName" prefixLabel="By " />)

      expect(screen.getByTestId('creator-button')).toBeInTheDocument()
      expect(screen.getByTestId('creator-name')).toHaveTextContent('By CreatorName')
      expect(screen.getByTestId('avatar-image')).toHaveAttribute('src', 'https://example.com/face.png')
    })

    it('should call openProfileModal when clicked', () => {
      render(<DetailModalCreator address="0xCreator" name="CreatorName" prefixLabel="By " />)

      screen.getByTestId('creator-button').click()
      expect(mockOpenProfile).toHaveBeenCalledWith('0xCreator')
    })
  })

  describe('when the creator profile resolves only the name', () => {
    beforeEach(() => {
      mockUseCreatorProfile.mockReturnValue({
        isDclFoundation: false,
        creatorName: '0xabcd…ef12',
        avatarFace: undefined,
        backgroundColor: '#abcdef'
      })
    })

    it('should render the abbreviated address as the name', () => {
      render(<DetailModalCreator address="0xabcdef1234567890abcdef1234567890abcdef12" name={undefined} prefixLabel="By " />)

      expect(screen.getByTestId('creator-name')).toHaveTextContent('0xabcd…ef12')
    })

    it('should forward the hook-provided background color to the fallback so it stays consistent across surfaces', () => {
      render(<DetailModalCreator address="0xabcdef1234567890abcdef1234567890abcdef12" name={undefined} prefixLabel="By " />)

      expect(screen.getByTestId('avatar-fallback').getAttribute('data-fallback-color')).toBe('#abcdef')
    })
  })

  describe('when the creator profile resolves to nothing', () => {
    beforeEach(() => {
      mockUseCreatorProfile.mockReturnValue({
        isDclFoundation: false,
        creatorName: undefined,
        avatarFace: undefined,
        backgroundColor: '#ffffff'
      })
    })

    it('should not render the creator row', () => {
      render(<DetailModalCreator address={undefined} name={undefined} prefixLabel="By " />)

      expect(screen.queryByTestId('creator-row')).not.toBeInTheDocument()
    })
  })

  describe('when the creator profile resolves the Decentraland Foundation', () => {
    beforeEach(() => {
      mockUseCreatorProfile.mockReturnValue({
        isDclFoundation: true,
        creatorName: 'Decentraland Foundation',
        avatarFace: '/dcl-logo.svg',
        backgroundColor: '#9d76e3'
      })
    })

    it('should render the Foundation name', () => {
      render(<DetailModalCreator address="0xFoundation" name="Decentraland Foundation" prefixLabel="By " />)

      expect(screen.getByTestId('creator-name')).toHaveTextContent('Decentraland Foundation')
    })

    it('should render the Foundation logo as the avatar', () => {
      render(<DetailModalCreator address="0xFoundation" name="Decentraland Foundation" prefixLabel="By " />)

      expect(screen.getByTestId('avatar-image')).toHaveAttribute('src', '/dcl-logo.svg')
    })

    it('should forward the address and name to useCreatorProfile so the foundation match runs upstream', () => {
      mockUseCreatorProfile.mockReturnValue({
        isDclFoundation: true,
        creatorName: 'Decentraland Foundation',
        avatarFace: '/dcl-logo.svg',
        backgroundColor: '#9d76e3'
      })
      render(<DetailModalCreator address="0xFoundation" name="Decentraland Foundation" prefixLabel="By " />)

      expect(mockUseCreatorProfile).toHaveBeenCalledWith('0xFoundation', 'Decentraland Foundation', expect.any(String))
    })
  })
})
