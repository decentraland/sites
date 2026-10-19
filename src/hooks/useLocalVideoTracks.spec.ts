import { useTracks } from '@livekit/components-react'
import { renderHook } from '@testing-library/react'
import { RoomEvent, Track } from 'livekit-client'
import { useLocalVideoTracks } from './useLocalVideoTracks'

jest.mock('@livekit/components-react', () => ({
  useTracks: jest.fn()
}))

const mockUseTracks = useTracks as jest.MockedFunction<typeof useTracks>

const localTrack = (source: Track.Source, isMuted: boolean) =>
  ({ participant: { isLocal: true }, source, publication: { isMuted } }) as unknown as ReturnType<typeof useTracks>[number]

describe('useLocalVideoTracks', () => {
  let tracks: ReturnType<typeof useTracks>

  beforeEach(() => {
    tracks = []
    mockUseTracks.mockImplementation(() => tracks)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when subscribing to the room tracks', () => {
    it('should re-evaluate when a track is muted or unmuted', () => {
      renderHook(() => useLocalVideoTracks())
      expect(mockUseTracks.mock.calls[0][1]?.updateOnlyOn).toEqual(expect.arrayContaining([RoomEvent.TrackMuted, RoomEvent.TrackUnmuted]))
    })
  })

  describe('when the local camera publication is muted', () => {
    beforeEach(() => {
      tracks = [localTrack(Track.Source.Camera, true)]
    })

    it('should report no local camera', () => {
      const { result } = renderHook(() => useLocalVideoTracks())
      expect(result.current.hasLocalCamera).toBe(false)
    })
  })

  describe('when the local camera publication is live', () => {
    beforeEach(() => {
      tracks = [localTrack(Track.Source.Camera, false)]
    })

    it('should report a local camera', () => {
      const { result } = renderHook(() => useLocalVideoTracks())
      expect(result.current.hasLocalCamera).toBe(true)
    })
  })
})
