import { memo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import type { HotScene } from '../../../features/events/events.discovery.types'
import { useGetHotScenesQuery } from '../../../features/events/scenes.discovery'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { SectionViewedTrack, SegmentEvent } from '../../../modules/segment'
import { AnimatedSection } from '../AnimatedSection'
import {
  LiveScenesCardsContainer,
  LiveScenesSection,
  LiveScenesTitle,
  SceneCard,
  SceneCardBadge,
  SceneCardCoords,
  SceneCardImage,
  SceneCardInfo,
  SceneCardTitle,
  ViewAllLink
} from './LiveScenes.styled'

const MAX_SCENES = 6

const isGenesisPlaza = (scene: HotScene): boolean => scene.name.toLowerCase().includes('genesis plaza')

const selectLiveScenes = (scenes: HotScene[]): HotScene[] =>
  scenes
    .filter(scene => !isGenesisPlaza(scene) && scene.usersTotalCount > 0)
    .sort((a, b) => b.usersTotalCount - a.usersTotalCount)
    .slice(0, MAX_SCENES)

type LiveSceneCardProps = {
  scene: HotScene
}

const LiveSceneCard = memo(({ scene }: LiveSceneCardProps) => {
  const l = useFormatMessage()
  const trackClick = useTrackClick()
  const coordinates = `${scene.baseCoords[0]},${scene.baseCoords[1]}`
  return (
    <SceneCard
      to={`/places/place/${coordinates}`}
      onClick={trackClick}
      data-place={SectionViewedTrack.CREATORS_LIVE_SCENES}
      data-event={SegmentEvent.CLICK}
      data-title={scene.name}
    >
      <SceneCardImage>
        <img src={scene.thumbnail} alt={scene.name} loading="lazy" />
        <SceneCardBadge>{l('component.creators_landing.live_scenes.online', { count: scene.usersTotalCount })}</SceneCardBadge>
      </SceneCardImage>
      <SceneCardInfo>
        <SceneCardTitle>{scene.name}</SceneCardTitle>
        <SceneCardCoords>{coordinates}</SceneCardCoords>
      </SceneCardInfo>
    </SceneCard>
  )
})

const CreatorsLiveScenes = memo(() => {
  const l = useFormatMessage()
  const trackClick = useTrackClick()
  const { data, isLoading } = useGetHotScenesQuery()
  const scenes = selectLiveScenes(data)

  if (isLoading || scenes.length === 0) return null

  return (
    <AnimatedSection trackPlace={SectionViewedTrack.CREATORS_LIVE_SCENES}>
      <LiveScenesSection>
        <LiveScenesTitle>
          <span>{l('component.creators_landing.live_scenes.title_highlight')}</span> {l('component.creators_landing.live_scenes.title')}
        </LiveScenesTitle>
        <LiveScenesCardsContainer>
          {scenes.map(scene => (
            <LiveSceneCard key={scene.id} scene={scene} />
          ))}
        </LiveScenesCardsContainer>
        <ViewAllLink
          to="/places"
          onClick={trackClick}
          data-place={SectionViewedTrack.CREATORS_LIVE_SCENES}
          data-event={SegmentEvent.CLICK}
          data-title="view-all"
        >
          {l('component.creators_landing.live_scenes.view_all')}
          <ChevronRightIcon />
        </ViewAllLink>
      </LiveScenesSection>
    </AnimatedSection>
  )
})

export { CreatorsLiveScenes }
