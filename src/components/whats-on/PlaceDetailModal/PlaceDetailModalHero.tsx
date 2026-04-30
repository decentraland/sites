import { useMemo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTranslation } from '@dcl/hooks'
import { Tooltip, useTheme } from 'decentraland-ui2'
import { useCopyShareLink } from '../../../hooks/useCopyShareLink'
import { buildPlaceShareUrl } from '../../../utils/whatsOnUrl'
import { JumpInButton } from '../../jump/JumpInButton'
import { DetailModalCreator } from '../DetailModal'
import {
  ActionsRow,
  CloseButton,
  CloseIconStyled,
  CopyButton,
  CopyIconStyled,
  HeroContent,
  HeroImage,
  HeroOverlay,
  HeroSection,
  ModalTitle
} from '../DetailModal/DetailModal.styled'
import type { ModalPlaceData } from './PlaceDetailModal.types'

function PlaceDetailModalHero({ data, onClose }: { data: ModalPlaceData; onClose: () => void }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [x, y] = data.coordinates
  const realm = data.worldName ?? undefined

  const shareUrl = useMemo(
    () => buildPlaceShareUrl({ position: data.isWorld ? null : `${x},${y}`, world: data.worldName }),
    [data.isWorld, data.worldName, x, y]
  )
  const { copied, handleCopy } = useCopyShareLink(shareUrl)

  return (
    <HeroSection>
      {data.image && <HeroImage src={data.image} alt={data.title} />}
      <HeroOverlay />
      <CloseButton onClick={onClose} aria-label={t('place_detail.close')}>
        {isMobile ? <ArrowBackIosNewIcon sx={{ fontSize: 20, color: '#FCFCFC' }} /> : <CloseIconStyled />}
      </CloseButton>
      <HeroContent>
        <ModalTitle id="place-detail-title">{data.title}</ModalTitle>
        <DetailModalCreator address={data.ownerAddress} name={data.ownerName} prefixLabel={t('place_detail.by_prefix')} />
        <ActionsRow>
          <JumpInButton position={`${x},${y}`} realm={realm} size="medium">
            {t('place_detail.jump_in')}
          </JumpInButton>
          <Tooltip title={copied ? t('place_detail.copied') : t('place_detail.copy_link')} placement="top" arrow>
            <CopyButton onClick={handleCopy} aria-label={t('place_detail.copy_link')}>
              <CopyIconStyled />
            </CopyButton>
          </Tooltip>
        </ActionsRow>
      </HeroContent>
    </HeroSection>
  )
}

export { PlaceDetailModalHero }
