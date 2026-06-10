import { memo, useCallback } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PeopleIcon from '@mui/icons-material/People'
import type { CreatorWorld } from '../../../features/creators'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { Body, Card, LiveBadge, Name, RoleChip, Thumb } from './WorldCreationCard.styled'

interface WorldCreationCardProps {
  world: CreatorWorld
  onSelect: (worldName: string) => void
}

function WorldCreationCardComponent(props: WorldCreationCardProps) {
  const { world, onSelect } = props
  const t = useFormatMessage()
  const handleClick = useCallback(() => onSelect(world.name), [onSelect, world.name])
  const hasLiveUsers = typeof world.liveUserCount === 'number' && world.liveUserCount > 0

  return (
    <Card type="button" onClick={handleClick} aria-label={world.name}>
      <Thumb $image={world.thumbnail}>
        {hasLiveUsers && (
          <LiveBadge>
            <PeopleIcon />
            {world.liveUserCount}
          </LiveBadge>
        )}
      </Thumb>
      <Body>
        <Name>{world.name}</Name>
        <RoleChip $owner={world.role === 'owner'}>
          {t(world.role === 'owner' ? 'page.creators.role.owner' : 'page.creators.role.collaborator')}
        </RoleChip>
      </Body>
    </Card>
  )
}

const WorldCreationCard = memo(WorldCreationCardComponent)

export { WorldCreationCard }
