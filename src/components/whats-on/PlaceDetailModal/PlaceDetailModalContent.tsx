// eslint-disable-next-line @typescript-eslint/naming-convention
import FavoriteIcon from '@mui/icons-material/Favorite'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PeopleIcon from '@mui/icons-material/People'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PublicIcon from '@mui/icons-material/Public'
import { useTranslation } from '@dcl/hooks'
import { linkifyText } from '../../../utils/linkifyText'
import { ContentDivider, ContentSection, DescriptionText, MetaRow, MetaText, SectionLabel } from '../DetailModal/DetailModal.styled'
import type { ModalPlaceData } from './PlaceDetailModal.types'

const ICON_FONT_SIZE = 18

function PlaceDetailModalContent({ data }: { data: ModalPlaceData }) {
  const { t } = useTranslation()

  const hasDescription = Boolean(data.description)
  const locationLabel = data.isWorld && data.worldName ? data.worldName : `${data.coordinates[0]}, ${data.coordinates[1]}`
  const locationKey = data.isWorld ? 'place_detail.world_label' : 'place_detail.location'
  const showStats = data.favorites > 0 || data.userCount > 0

  return (
    <ContentSection>
      {hasDescription && (
        <>
          <SectionLabel>{t('place_detail.about')}</SectionLabel>
          <DescriptionText>{linkifyText(data.description ?? '')}</DescriptionText>
          <ContentDivider />
        </>
      )}
      <SectionLabel>{t(locationKey)}</SectionLabel>
      <MetaRow>
        <MetaText>
          {data.isWorld ? <PublicIcon sx={{ fontSize: ICON_FONT_SIZE }} /> : <PlaceOutlinedIcon sx={{ fontSize: ICON_FONT_SIZE }} />}
          {locationLabel}
        </MetaText>
      </MetaRow>
      {showStats && (
        <>
          <ContentDivider />
          <MetaRow>
            {data.userCount > 0 && (
              <MetaText>
                <PeopleIcon sx={{ fontSize: ICON_FONT_SIZE }} />
                {t('place_detail.people_now', { count: data.userCount })}
              </MetaText>
            )}
            {data.favorites > 0 && (
              <MetaText>
                <FavoriteIcon sx={{ fontSize: ICON_FONT_SIZE }} />
                {t('place_detail.favorites', { count: data.favorites })}
              </MetaText>
            )}
          </MetaRow>
        </>
      )}
    </ContentSection>
  )
}

export { PlaceDetailModalContent }
