import { memo } from 'react'
import type { FC } from 'react'
import { Card, CardActionArea, CardContent, Typography } from 'decentraland-ui2'
import { truncateAddress } from '../../../features/storage'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'

interface PlayerCardProps {
  address: string
  displayName?: string
  onClick: () => void
}

const PlayerCardComponent: FC<PlayerCardProps> = ({ address, displayName, onClick }) => {
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
    </Card>
  )
}

const PlayerCard = memo(PlayerCardComponent)
PlayerCard.displayName = 'PlayerCard'

export { PlayerCard }
export type { PlayerCardProps }
