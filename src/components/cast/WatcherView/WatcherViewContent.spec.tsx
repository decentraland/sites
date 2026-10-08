import React from 'react'
import { useRemoteParticipants } from '@livekit/components-react'
import { render, screen } from '@testing-library/react'
import { Track } from 'livekit-client'
import { usePresentationOptional } from '../../../features/cast2/contexts/PresentationContext'
import { WatcherViewContent } from './WatcherViewContent'

jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))
jest.mock('@livekit/components-react', () => ({ useRemoteParticipants: jest.fn() }))
jest.mock('../../../features/cast2/contexts/PresentationContext', () => ({ usePresentationOptional: jest.fn() }))
jest.mock('../../../features/cast2/cast2.utils', () => ({
  ...jest.requireActual('../../../features/cast2/cast2.utils'),
  getDisplayName: (participant: { identity: string }) => participant.identity
}))
jest.mock('../../../features/cast2/useCastTranslation', () => ({
  useCastTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('../ParticipantGrid/ParticipantGrid', () => ({
  ParticipantGrid: () => React.createElement('div', null, 'participant-grid')
}))
jest.mock('../PresentationStage/PresentationStage', () => ({
  PresentationStage: () => React.createElement('div', null, 'presentation-stage')
}))
jest.mock('../LiveKitEnhancements/EmptyStreamState', () => ({
  EmptyStreamState: ({ message, participantName }: { message: string; participantName?: string }) =>
    React.createElement('div', null, [message, participantName].filter(Boolean).join(' '))
}))
jest.mock('../LiveStreamCounter/LiveStreamCounter', () => ({
  LiveStreamCounter: () => React.createElement('div')
}))

const participant = (identity: string, metadata: string, source?: Track.Source, isMuted = false) => ({
  identity,
  metadata,
  videoTrackPublications: new Map(source ? [['video', { source, track: {}, isMuted }]] : [])
})

const streamer = (source: Track.Source, isMuted = false) => participant('0xstreamer', JSON.stringify({ role: 'streamer' }), source, isMuted)
const bystanders = [participant('0xbroken', '{not json'), participant('0xviewer', '')]
const composed = { state: { slide: { url: 'https://presenter.test/slides/ab12.png', width: 1920, height: 1080 } } }

describe.each([
  ['a composed presentation is live without a streamer', [], composed, 'presentation-stage'],
  ['a legacy presentation is live without a streamer', [], { state: { slide: null } }, 'empty_state.watcher_message'],
  ['no participant is a readable streamer', bystanders, null, 'empty_state.watcher_message'],
  ['the streamer has an active camera', [streamer(Track.Source.Camera)], null, 'participant-grid'],
  ['the streamer has an active screen share', [streamer(Track.Source.ScreenShare)], null, 'participant-grid'],
  ['the streamer has no live video', [...bystanders, streamer(Track.Source.Camera, true)], null, 'empty_state.streamer_action 0xstreamer']
])('when %s', (_, participants, presentation, view) => {
  beforeEach(() => {
    ;(useRemoteParticipants as jest.Mock).mockReturnValue(participants)
    ;(usePresentationOptional as jest.Mock).mockReturnValue(presentation)
    render(<WatcherViewContent />)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it(`should render ${view}`, () => {
    expect(screen.getByText(view)).toBeInTheDocument()
  })
})
