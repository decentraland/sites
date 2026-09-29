import { memo, useCallback } from 'react'
import type { FC } from 'react'
import { Button, Card, CardContent, Chip } from 'decentraland-ui2'
import type { CollaboratorScene } from '../../../features/storage'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { CardFooter, CardLabel, LocationIcon } from '../_shared/StorageCard.styled'
import { SceneLocation, SceneTitle } from './CollaboratorSceneCard.styled'

interface CollaboratorSceneCardProps {
  scene: CollaboratorScene
  onEditClick: (scene: CollaboratorScene) => void
}

const getSceneLocation = (scene: CollaboratorScene): string => {
  if (scene.worldName) return `${scene.worldName} · ${scene.baseParcel}`
  return scene.title ? scene.baseParcel : ''
}

const CollaboratorSceneCardComponent: FC<CollaboratorSceneCardProps> = ({ scene, onEditClick }) => {
  const t = useFormatMessage()

  const realmLabel =
    scene.realmKind === 'world' ? t('component.storage.select_page.realm_world') : t('component.storage.select_page.realm_genesis')
  const location = getSceneLocation(scene)

  const handleEditClick = useCallback(() => {
    onEditClick(scene)
  }, [onEditClick, scene])

  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: 1 }}>
        <CardLabel>
          <LocationIcon />
          <SceneTitle variant="subtitle2" noWrap>
            {scene.title ?? scene.baseParcel}
          </SceneTitle>
        </CardLabel>
        {location ? (
          <SceneLocation variant="caption" color="text.secondary" noWrap>
            {location}
          </SceneLocation>
        ) : null}
      </CardContent>
      <CardFooter>
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
      </CardFooter>
    </Card>
  )
}

const CollaboratorSceneCard = memo(CollaboratorSceneCardComponent)
CollaboratorSceneCard.displayName = 'CollaboratorSceneCard'

export { CollaboratorSceneCard }
export type { CollaboratorSceneCardProps }
