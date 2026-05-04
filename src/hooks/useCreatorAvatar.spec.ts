import { renderHook } from '@testing-library/react'
import { useCreatorAvatar } from './useCreatorAvatar'
import { useProfileAvatar } from './useProfileAvatar'

jest.mock('./useProfileAvatar', () => ({ useProfileAvatar: jest.fn() }))

const mockedUseProfileAvatar = useProfileAvatar as jest.MockedFunction<typeof useProfileAvatar>

const VALID_ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const REAL_FACE_URL =
  'https://profile-images.decentraland.org/entities/bafkreigo2n27ju2hxlfjye2xty7trqy4zbznvmquxfu4nmrvvwvgvm4y7u/face.png'

describe('useCreatorAvatar', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when no address is provided', () => {
    beforeEach(() => {
      mockedUseProfileAvatar.mockReturnValue({
        avatar: undefined,
        avatarForCard: undefined,
        avatarFace: undefined,
        name: undefined,
        backgroundColor: '#ffffff'
      })
    })

    it('should return undefined avatar and face', () => {
      const { result } = renderHook(() => useCreatorAvatar(undefined))

      expect(result.current.avatar).toBeUndefined()
      expect(result.current.avatarFace).toBeUndefined()
    })

    it('should forward the undefined address to useProfileAvatar so the underlying query is skipped', () => {
      renderHook(() => useCreatorAvatar(undefined))

      expect(mockedUseProfileAvatar).toHaveBeenCalledWith(undefined)
    })
  })

  describe('when the catalyst profile resolves to a deployed face', () => {
    beforeEach(() => {
      mockedUseProfileAvatar.mockReturnValue({
        avatar: undefined,
        avatarForCard: undefined,
        avatarFace: REAL_FACE_URL,
        name: 'CatalystName',
        backgroundColor: '#abcdef'
      })
    })

    it('should expose the catalyst-resolved face url', () => {
      const { result } = renderHook(() => useCreatorAvatar(VALID_ADDRESS, 'Fallback'))

      expect(result.current.avatarFace).toBe(REAL_FACE_URL)
    })

    it('should forward the address to useProfileAvatar so the catalyst lookup is keyed to the creator', () => {
      renderHook(() => useCreatorAvatar(VALID_ADDRESS, 'Fallback'))

      expect(mockedUseProfileAvatar).toHaveBeenCalledWith(VALID_ADDRESS)
    })

    it('should prefer the catalyst name over the caller-provided fallback when building the avatar', () => {
      const { result } = renderHook(() => useCreatorAvatar(VALID_ADDRESS, 'Fallback'))

      expect(result.current.avatar?.name).toBe('CatalystName')
      expect((result.current.avatar as unknown as { avatar: { snapshots: { face256: string } } }).avatar.snapshots.face256).toBe(
        REAL_FACE_URL
      )
    })

    it('should propagate the catalyst-derived background color to consumers', () => {
      const { result } = renderHook(() => useCreatorAvatar(VALID_ADDRESS, 'Fallback'))

      expect(result.current.backgroundColor).toBe('#abcdef')
    })
  })

  describe('when the catalyst profile has no deployed face', () => {
    beforeEach(() => {
      mockedUseProfileAvatar.mockReturnValue({
        avatar: undefined,
        avatarForCard: undefined,
        avatarFace: undefined,
        name: undefined,
        backgroundColor: '#ffffff'
      })
    })

    it('should fall back to white when no profile name is known', () => {
      const { result } = renderHook(() => useCreatorAvatar(VALID_ADDRESS, 'Fallback'))

      expect(result.current.backgroundColor).toBe('#ffffff')
    })

    it('should leave avatarFace undefined so callers can fall back to a placeholder', () => {
      const { result } = renderHook(() => useCreatorAvatar(VALID_ADDRESS, 'Fallback'))

      expect(result.current.avatarFace).toBeUndefined()
    })

    it('should still build an avatar shell using the caller-provided name', () => {
      const { result } = renderHook(() => useCreatorAvatar(VALID_ADDRESS, 'Fallback'))

      expect(result.current.avatar?.name).toBe('Fallback')
      expect((result.current.avatar as unknown as { avatar: { snapshots: { face256: string } } }).avatar.snapshots.face256).toBe('')
    })
  })
})
