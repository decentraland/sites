import { useTracks } from '@livekit/components-react'
import { renderHook } from '@testing-library/react'
import { RoomEvent, Track } from 'livekit-client'
import { useLocalVideoTracks } from './useLocalVideoTracks'

jest.mock('@livekit/components-react', () => ({
  useTracks: jest.fn()
}))

const mockUseTracks = useTracks as jest.MockedFunction<typeof useTracks>

describe.each([
  ['muted', true, false],
  ['live', false, true]
])('when the local camera publication is %s', (_, isMuted, hasLocalCamera) => {
  let result: { current: ReturnType<typeof useLocalVideoTracks> }

  beforeEach(() => {
    mockUseTracks.mockReturnValue([
      { participant: { isLocal: true }, source: Track.Source.Camera, publication: { isMuted } }
    ] as unknown as ReturnType<typeof useTracks>)
    ;({ result } = renderHook(() => useLocalVideoTracks()))
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it(`should report hasLocalCamera as ${hasLocalCamera}`, () => {
    expect(result.current.hasLocalCamera).toBe(hasLocalCamera)
  })

  it('should re-evaluate on track mute and unmute', () => {
    expect(mockUseTracks.mock.calls[0][1]?.updateOnlyOn).toEqual([RoomEvent.TrackMuted, RoomEvent.TrackUnmuted])
  })
})
