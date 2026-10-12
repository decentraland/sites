import { memo } from 'react'
import type { FC } from 'react'
import { Card, CardActionArea, CardContent, Checkbox, Typography } from 'decentraland-ui2'
import { truncateAddress } from '../../../features/storage'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { CardFooter } from '../_shared/StorageCard.styled'

interface PlayerCardProps {
  address: string
  displayName?: string
  onClick: () => void
  selected?: boolean
  onToggle?: (address: string) => void
}

const PlayerCardComponent: FC<PlayerCardProps> = props => {
  const { address, displayName, onClick, selected = false, onToggle } = props
  const t = useFormatMessage()
  const label = displayName ?? truncateAddress(address)

  return (
    <Card variant="outlined">
      <CardActionArea onClick={onClick} aria-label={t('component.storage.player_page.select_player', { address })}>
        <CardContent>
          <Typography variant="subtitle1">{label}</Typography>
          <Typography variant="caption" color="text.secondary">
            {truncateAddress(address)}
          </Typography>
        </CardContent>
      </CardActionArea>
      {onToggle ? (
        <CardFooter>
          <Checkbox
            checked={selected}
            onChange={() => onToggle(address)}
            // eslint-disable-next-line @typescript-eslint/naming-convention
            inputProps={{ 'aria-label': t('component.storage.common.select_row', { name: label }) }}
          />
        </CardFooter>
      ) : null}
    </Card>
  )
}

const PlayerCard = memo(PlayerCardComponent)
PlayerCard.displayName = 'PlayerCard'

export { PlayerCard }
export type { PlayerCardProps }
