import { memo } from 'react'
import type { FC } from 'react'
import { Card, CardActionArea, CardContent, Chip, Typography } from 'decentraland-ui2'
import { type Land, RoleType, getRoleLabelKey } from '../../../features/world/storage'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'

interface LandCardProps {
  land: Land
  onClick: () => void
}

const LandCardComponent: FC<LandCardProps> = ({ land, onClick }) => {
  const t = useFormatMessage()
  const roleLabel = t(`component.storage.role.${getRoleLabelKey(land.role)}`)

  return (
    <Card variant="outlined">
      <CardActionArea onClick={onClick} aria-label={t('component.storage.select_page.select_land', { name: land.name })}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            {land.name}
          </Typography>
          <Chip label={roleLabel} size="small" color={land.role === RoleType.OWNER ? 'primary' : 'default'} />
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

const LandCard = memo(LandCardComponent)
LandCard.displayName = 'LandCard'

export { LandCard }
export type { LandCardProps }
