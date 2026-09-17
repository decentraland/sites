import { memo, useCallback } from 'react'
import type { FC } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import FmdGoodIcon from '@mui/icons-material/FmdGood'
import { Box, Button, Card, CardActions, CardContent, Chip, Typography } from 'decentraland-ui2'
import type { CollaboratorScene } from '../../../features/storage'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'

interface CollaboratorSceneCardProps {
  scene: CollaboratorScene
  onEditClick: (scene: CollaboratorScene) => void
}

const CollaboratorSceneCardComponent: FC<CollaboratorSceneCardProps> = ({ scene, onEditClick }) => {
  const t = useFormatMessage()

  const realmLabel =
    scene.realmKind === 'world' ? t('component.storage.select_page.realm_world') : t('component.storage.select_page.realm_genesis')
  const location = scene.worldName ? `${scene.worldName} · ${scene.baseParcel}` : scene.title ? scene.baseParcel : ''

  const handleEditClick = useCallback(() => {
    onEditClick(scene)
  }, [onEditClick, scene])

  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <FmdGoodIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ maxWidth: 220 }}>
            {scene.title ?? scene.baseParcel}
          </Typography>
        </Box>
        {location ? (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 240 }}>
            {location}
          </Typography>
        ) : null}
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 1.5 }}>
        <Chip label={realmLabel} size="small" color="default" />
        <Button
          variant="contained"
          size="small"
          color="primary"
          disableElevation
          onClick={handleEditClick}
          aria-label={t('component.storage.select_page.edit')}
        >
          {t('component.storage.select_page.edit')}
        </Button>
      </CardActions>
    </Card>
  )
}

const CollaboratorSceneCard = memo(CollaboratorSceneCardComponent)
CollaboratorSceneCard.displayName = 'CollaboratorSceneCard'

export { CollaboratorSceneCard }
export type { CollaboratorSceneCardProps }
