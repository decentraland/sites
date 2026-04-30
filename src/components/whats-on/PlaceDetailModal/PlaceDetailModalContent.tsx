// eslint-disable-next-line @typescript-eslint/naming-convention
import FavoriteIcon from '@mui/icons-material/Favorite'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PeopleIcon from '@mui/icons-material/People'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PublicIcon from '@mui/icons-material/Public'
import { useTranslation } from '@dcl/hooks'
import {
  ContentDivider,
  ContentSection,
  DescriptionText,
  ScheduleRow,
  ScheduleText,
  SectionLabel
} from '../EventDetailModal/EventDetailModal.styled'
import type { ModalPlaceData } from './PlaceDetailModal.types'

function PlaceDetailModalContent({ data }: { data: ModalPlaceData }) {
  const { t } = useTranslation()

  const hasDescription = Boolean(data.description)
  const locationLabel = data.isWorld && data.worldName ? data.worldName : `${data.coordinates[0]}, ${data.coordinates[1]}`
  const locationKey = data.isWorld ? 'place_detail.world_label' : 'place_detail.location'

  return (
    <ContentSection>
      {hasDescription && (
        <>
          <SectionLabel>{t('place_detail.about')}</SectionLabel>
          <DescriptionText>{data.description}</DescriptionText>
          <ContentDivider />
        </>
      )}
      <SectionLabel>{t(locationKey)}</SectionLabel>
      <ScheduleRow>
        <ScheduleText sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {data.isWorld ? <PublicIcon sx={{ fontSize: 18 }} /> : <PlaceOutlinedIcon sx={{ fontSize: 18 }} />}
          {locationLabel}
        </ScheduleText>
      </ScheduleRow>
      {(data.favorites > 0 || data.userCount > 0) && (
        <>
          <ContentDivider />
          <ScheduleRow sx={{ gap: 3, justifyContent: 'flex-start' }}>
            {data.userCount > 0 && (
              <ScheduleText sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon sx={{ fontSize: 18 }} />
                {t('place_detail.people_now', { count: data.userCount })}
              </ScheduleText>
            )}
            {data.favorites > 0 && (
              <ScheduleText sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FavoriteIcon sx={{ fontSize: 18 }} />
                {t('place_detail.favorites', { count: data.favorites })}
              </ScheduleText>
            )}
          </ScheduleRow>
        </>
      )}
    </ContentSection>
  )
}

export { PlaceDetailModalContent }
