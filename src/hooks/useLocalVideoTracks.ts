import { useMemo } from 'react'
import { useTracks } from '@livekit/components-react'
import { Track } from 'livekit-client'

const useLocalVideoTracks = () => {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], {
    updateOnlyOn: [],
    onlySubscribed: false
  })

  const { hasLocalCamera, hasLocalScreenShare } = useMemo(() => {
    const localTracks = tracks.filter(trackRef => trackRef.participant.isLocal)
    const hasCamera = localTracks.some(
      trackRef => trackRef.source === Track.Source.Camera && trackRef.publication !== undefined && !trackRef.publication.isMuted
    )
    const hasScreen = localTracks.some(
      trackRef => trackRef.source === Track.Source.ScreenShare && trackRef.publication !== undefined && !trackRef.publication.isMuted
    )
    return { hasLocalCamera: hasCamera, hasLocalScreenShare: hasScreen }
  }, [tracks])

  return { hasLocalCamera, hasLocalScreenShare }
}

export { useLocalVideoTracks }
