import { act, renderHook, waitFor } from '@testing-library/react'
import { useCreatorAvatar } from './useCreatorAvatar'

const VALID_ADDRESS_A = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const VALID_ADDRESS_B = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
const EXPECTED_FACE_A = `https://profile-images.decentraland.org/entities/${VALID_ADDRESS_A}/face.png`

describe('useCreatorAvatar', () => {
  let fetchMock: jest.Mock
  let originalFetch: typeof fetch

  beforeEach(() => {
    originalFetch = global.fetch
    fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 } as Response)
    ;(global as unknown as { fetch: typeof fetch }).fetch = fetchMock
  })

  afterEach(() => {
    ;(global as unknown as { fetch: typeof fetch }).fetch = originalFetch
    jest.resetAllMocks()
  })

  describe('when no address is provided', () => {
    it('should return undefined avatar and face', () => {
      const { result } = renderHook(() => useCreatorAvatar(undefined))

      expect(result.current.avatar).toBeUndefined()
      expect(result.current.avatarFace).toBeUndefined()
    })
  })

  describe('when the address is not a well-formed 0x + 40-hex string', () => {
    it('should not probe the network and should keep avatarFace undefined', () => {
      const { result } = renderHook(() => useCreatorAvatar('../admin', 'Attacker'))

      expect(fetchMock).not.toHaveBeenCalled()
      expect(result.current.avatarFace).toBeUndefined()
    })
  })

  describe('when a valid address is provided', () => {
    it('should keep the face hidden until the probe succeeds', () => {
      fetchMock.mockReturnValueOnce(new Promise<Response>(() => undefined))
      const { result } = renderHook(() => useCreatorAvatar(VALID_ADDRESS_A, 'Alice'))

      expect(result.current.avatarFace).toBeUndefined()
      expect((result.current.avatar as unknown as { avatar: { snapshots: { face256: string } } }).avatar.snapshots.face256).toBe('')
    })

    it('should return an avatar with the profile-images face URL after the probe succeeds', async () => {
      const { result } = renderHook(() => useCreatorAvatar(VALID_ADDRESS_A, 'Alice'))

      await waitFor(() => {
        expect(result.current.avatarFace).toBe(EXPECTED_FACE_A)
      })
      expect(result.current.avatarFace).toBe(EXPECTED_FACE_A)
      expect(result.current.avatar?.name).toBe('Alice')
      expect((result.current.avatar as unknown as { avatar: { snapshots: { face256: string } } }).avatar.snapshots.face256).toBe(
        EXPECTED_FACE_A
      )
    })
  })

  describe('when the face image fails to load', () => {
    it('should clear the face256 so callers can fall back to a placeholder', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      const { result } = renderHook(() => useCreatorAvatar(VALID_ADDRESS_A, 'Broken'))

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(EXPECTED_FACE_A, expect.objectContaining({ method: 'HEAD' }))
      })
      await act(async () => undefined)
      expect((result.current.avatar as unknown as { avatar: { snapshots: { face256: string } } }).avatar.snapshots.face256).toBe('')
    })

    it('should remember the broken URL so sibling cards skip the retry on mount', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      renderHook(() => useCreatorAvatar(VALID_ADDRESS_B))
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(1)
      })
      await act(async () => undefined)

      const priorCount = fetchMock.mock.calls.length
      renderHook(() => useCreatorAvatar(VALID_ADDRESS_B))

      expect(fetchMock).toHaveBeenCalledTimes(priorCount)
    })
  })
})
