import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from '@dcl/hooks'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import avatarImage from '../../../images/whats-on/images/host_avatar.webp'
import sceneImage from '../../../images/whats-on/images/host_scene.webp'
import { redirectToAuth } from '../../../utils/authRedirect'
import {
  AvatarImage,
  BannerButton,
  BannerSection,
  BannerSubtitle,
  BannerTitle,
  ButtonRow,
  CheckBoxIcon,
  CheckBoxShape,
  CheckText,
  ChecklistItem,
  ChecklistWrapper,
  ContentArea,
  SceneImage,
  SceneImageWrapper
} from './HostBanner.styled'

const LEARN_MORE_URL = 'https://decentraland.org/blog/about-decentraland/how-to-make-and-run-an-event-in-decentraland'
const CHECK_KEYS = ['check_1', 'check_2', 'check_3'] as const

function HostBanner() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { hasValidIdentity } = useAuthIdentity()

  const handleCreate = useCallback(() => {
    if (hasValidIdentity) {
      navigate('/whats-on/new-hangout')
    } else {
      redirectToAuth('/whats-on/new-hangout')
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
        <ChecklistWrapper>
          {CHECK_KEYS.map(key => (
            <ChecklistItem key={key}>
              <CheckBoxShape aria-hidden="true">
                <CheckBoxIcon />
              </CheckBoxShape>
              <CheckText>{t(`host_banner.${key}`)}</CheckText>
            </ChecklistItem>
          ))}
        </ChecklistWrapper>
        <ButtonRow>
          <BannerButton
            data-testid="create-button"
            variant="contained"
            color="primary"
            size="large"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            {t('host_banner.create_event')}
          </BannerButton>
          <BannerButton
            data-testid="learn-more-button"
            variant="contained"
            color="secondary"
            size="large"
            disableElevation
            onClick={handleLearnMore}
          >
            {t('host_banner.learn_more')}
          </BannerButton>
        </ButtonRow>
      </ContentArea>
      <SceneImageWrapper>
        <SceneImage src={sceneImage} alt="" aria-hidden="true" />
      </SceneImageWrapper>
    </BannerSection>
  )
}

export { HostBanner }
