import { Helmet } from 'react-helmet-async'
import { useNavigate, useParams } from 'react-router-dom'
import { Typography } from 'decentraland-ui2'
import { ProfileSurface } from '../../components/profile/ProfileSurface'
import type { ProfileTab } from '../../components/profile/ProfileTabs'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { InvalidStub } from './ProfilePage.styled'

const VALID_TABS: ProfileTab[] = ['overview', 'assets', 'creations', 'communities', 'places', 'photos', 'referral-rewards']

const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/

function isValidAddress(value: string | undefined): value is `0x${string}` {
  return Boolean(value && ADDRESS_REGEX.test(value))
}

function isValidTab(value: string | undefined): value is ProfileTab {
  return VALID_TABS.includes(value as ProfileTab)
}

function ProfilePage() {
  const t = useFormatMessage()
  const navigate = useNavigate()
  const { address, tab } = useParams<{ address: string; tab?: string }>()
  const { address: viewerAddress } = useAuthIdentity()

  const normalizedAddress = isValidAddress(address) ? address.toLowerCase() : null
  const isOwnProfile = Boolean(normalizedAddress && viewerAddress && normalizedAddress === viewerAddress.toLowerCase())
  const requestedTab: ProfileTab = isValidTab(tab) ? tab : 'overview'

  if (!normalizedAddress) {
    return (
      <InvalidStub>
        <Helmet>
          <title>{`${t('profile.not_found.title')} | Decentraland`}</title>
        </Helmet>
        <Typography variant="h3">{t('profile.not_found.title')}</Typography>
        <Typography variant="body1">{t('profile.not_found.description', { address: address ?? '' })}</Typography>
      </InvalidStub>
    )
  }

  return (
    <ProfileSurface
      address={normalizedAddress}
      isOwnProfile={isOwnProfile}
      activeTab={requestedTab}
      onTabChange={nextTab => navigate(`/profile/${normalizedAddress}/${nextTab}`)}
      manageDocumentTitle
    />
  )
}

export { ProfilePage }
