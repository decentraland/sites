import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from '@dcl/hooks'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import avatarImage from '../../../images/explore/images/host_avatar.webp'
import sceneImage from '../../../images/explore/images/host_scene.webp'
import { redirectToAuth } from '../../../utils/authRedirect'
import {
  AvatarImage,
  BannerSection,
  BannerSubtitle,
  BannerTitle,
  ButtonRow,
  CheckIcon,
  CheckText,
  ChecklistItem,
  ContentArea,
  CreateButton,
  LearnMoreButton,
  SceneImage
} from './HostBanner.styled'

const LEARN_MORE_URL = 'https://docs.decentraland.org/creator/events/'

function HostBanner() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { hasValidIdentity } = useAuthIdentity()

  const handleCreate = useCallback(() => {
    if (hasValidIdentity) {
      navigate('/whats-on/new-event')
    } else {
      redirectToAuth('/whats-on/new-event')
    }
  }, [hasValidIdentity, navigate])

  const handleLearnMore = useCallback(() => {
    window.open(LEARN_MORE_URL, '_blank', 'noopener')
  }, [])

  return (
    <BannerSection aria-label={t('host_banner.title')}>
      <AvatarImage src={avatarImage} alt="" aria-hidden="true" />
      <ContentArea>
        <BannerTitle>{t('host_banner.title')}</BannerTitle>
        <BannerSubtitle>{t('host_banner.subtitle')}</BannerSubtitle>
        <div>
          <ChecklistItem>
            <CheckIcon />
            <CheckText>{t('host_banner.check_1')}</CheckText>
          </ChecklistItem>
          <ChecklistItem>
            <CheckIcon />
            <CheckText>{t('host_banner.check_2')}</CheckText>
          </ChecklistItem>
          <ChecklistItem>
            <CheckIcon />
            <CheckText>{t('host_banner.check_3')}</CheckText>
          </ChecklistItem>
        </div>
        <ButtonRow>
          <CreateButton onClick={handleCreate}>
            <AddIcon sx={{ fontSize: 18 }} />
            {t('host_banner.create_event')}
          </CreateButton>
          <LearnMoreButton onClick={handleLearnMore}>{t('host_banner.learn_more')}</LearnMoreButton>
        </ButtonRow>
      </ContentArea>
      <SceneImage src={sceneImage} alt="" aria-hidden="true" />
    </BannerSection>
  )
}

export { HostBanner }
