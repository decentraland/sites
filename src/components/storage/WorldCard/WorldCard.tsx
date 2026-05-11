import { memo, useCallback, useState } from 'react'
import type { FC, MouseEvent } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
// eslint-disable-next-line @typescript-eslint/naming-convention
import FmdGoodIcon from '@mui/icons-material/FmdGood'
import {
  Box,
  Button,
  ButtonBase,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Menu,
  MenuItem,
  Typography
} from 'decentraland-ui2'
import { useGetWorldScenesQuery } from '../../../features/storage'
import type { World } from '../../../features/storage'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { CardLabel, MenuDivider } from './WorldCard.styled'

interface WorldCardProps {
  world: World
  onEditClick: (worldName: string, position?: string) => void
}

const WorldCardComponent: FC<WorldCardProps> = ({ world, onEditClick }) => {
  const t = useFormatMessage()
  const { data: scenes, isLoading } = useGetWorldScenesQuery({ worldName: world.name })
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const menuOpen = Boolean(anchorEl)

  const sceneCount = scenes?.length ?? 0
  const firstScene = scenes?.[0]
  const isMultiScene = sceneCount > 1

  const handleEditClick = useCallback(() => {
    onEditClick(world.name, firstScene?.baseParcel)
  }, [onEditClick, world.name, firstScene])

  const handleChevronClick = useCallback((event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }, [])

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  const handleSceneClick = useCallback(
    (baseParcel: string) => () => {
      setAnchorEl(null)
      onEditClick(world.name, baseParcel)
    },
    [onEditClick, world.name]
  )

  const sceneCountLabel = isLoading
    ? undefined
    : sceneCount === 1
      ? t('component.storage.select_page.scene_count_one')
      : t('component.storage.select_page.scenes_count', { count: String(sceneCount) })

  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: 1 }}>
        <CardLabel>
          <FmdGoodIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="subtitle2" fontWeight={600}>
            {world.name}
          </Typography>
        </CardLabel>
        {isLoading ? (
          <CircularProgress size={14} />
        ) : (
          <Typography variant="caption" color="text.secondary">
            {sceneCountLabel}
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 1.5 }}>
        <Chip
          label={world.role === 'owner' ? t('component.storage.common.owner') : t('component.storage.common.collaborator')}
          size="small"
          color="default"
        />
        <Box>
          {isMultiScene ? (
            <Button
              variant="contained"
              size="small"
              color="primary"
              disableElevation
              onClick={handleEditClick}
              aria-label={t('component.storage.select_page.edit')}
              sx={{ pr: 0, gap: 0 }}
            >
              {t('component.storage.select_page.edit')}
              <MenuDivider />
              <ButtonBase
                component="span"
                onClick={handleChevronClick}
                aria-label={t('component.storage.select_page.select_scene')}
                sx={{ display: 'inline-flex', alignItems: 'center', px: 0.25 }}
              >
                <ArrowDropDownIcon fontSize="small" />
              </ButtonBase>
            </Button>
          ) : (
            <Button
              variant="contained"
              size="small"
              color="primary"
              onClick={handleEditClick}
              aria-label={t('component.storage.select_page.edit')}
            >
              {t('component.storage.select_page.edit')}
            </Button>
          )}
          <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
            <MenuItem disabled sx={{ opacity: '1 !important' }}>
              <Typography variant="overline" color="text.secondary">
                {t('component.storage.select_page.edit_scenes')}
              </Typography>
            </MenuItem>
            {scenes?.map(scene => (
              <MenuItem key={scene.baseParcel} onClick={handleSceneClick(scene.baseParcel)}>
                <Typography variant="body2" noWrap sx={{ maxWidth: 280 }}>
                  {scene.title}
                </Typography>
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </CardActions>
    </Card>
  )
}

const WorldCard = memo(WorldCardComponent)
WorldCard.displayName = 'WorldCard'

export { WorldCard }
export type { WorldCardProps }
