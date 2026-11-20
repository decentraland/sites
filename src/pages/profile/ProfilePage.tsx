import { Helmet } from 'react-helmet-async'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { skipToken } from '@reduxjs/toolkit/query'
import { Button, CircularProgress, Typography } from 'decentraland-ui2'
import { ProfileSurface } from '../../components/profile/ProfileSurface'
import type { ProfileTab } from '../../components/profile/ProfileTabs'
import { useGetProfileAddressByNameQuery } from '../../features/profile/profile.names.client'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { getProfileName, isProfileAddress } from '../../utils/profileIdentifier'
import { InvalidStub } from './ProfilePage.styled'

const VALID_TABS: ProfileTab[] = ['overview', 'assets', 'creations', 'communities', 'places', 'photos', 'referral-rewards']

function isValidTab(value: string | undefined): value is ProfileTab {
  return VALID_TABS.includes(value as ProfileTab)
}

function ProfilePage() {
  const t = useFormatMessage()
  const navigate = useNavigate()
  // Keep the query string (`?env=…` overrides and share params) across tab navigation.
  const { search, hash } = useLocation()
  const { address, tab } = useParams<{ address: string; tab?: string }>()
  const { address: viewerAddress } = useAuthIdentity()

  const normalizedAddress = isProfileAddress(address) ? address.toLowerCase() : null
  const profileName = normalizedAddress ? undefined : getProfileName(address)
  const {
    currentData: resolvedAddress,
    isFetching,
    isUninitialized,
    isError,
    refetch
  } = useGetProfileAddressByNameQuery(profileName ?? skipToken)
  const isOwnProfile = Boolean(normalizedAddress && viewerAddress && normalizedAddress === viewerAddress.toLowerCase())
  const requestedTab: ProfileTab = isValidTab(tab) ? tab : 'overview'

  if (profileName) {
    if (isFetching || isUninitialized) {
      return (
        <InvalidStub>
          <CircularProgress aria-label={t('profile.name_lookup.loading')} />
        </InvalidStub>
      )
    }
    if (isError) {
      return (
        <InvalidStub>
          <Typography role="alert">{t('profile.name_lookup.error')}</Typography>
          <Button onClick={() => void refetch()}>{t('profile.name_lookup.retry')}</Button>
        </InvalidStub>
      )
    }
    if (resolvedAddress) {
      return <Navigate replace to={{ pathname: `/profile/${resolvedAddress}${tab ? `/${encodeURIComponent(tab)}` : ''}`, search, hash }} />
    }
  }

  if (!normalizedAddress) {
    return (
      <InvalidStub>
        <Helmet>
          <title>{`${t('profile.not_found.title')} | Decentraland`}</title>
        </Helmet>
        <Typography variant="h3">{t('profile.not_found.title')}</Typography>
        <Typography variant="body1">
          {profileName
            ? t('profile.name_lookup.not_found', { name: address })
            : t('profile.not_found.description', { address: address ?? '' })}
        </Typography>
      </InvalidStub>
    )
  }

  return (
    <ProfileSurface
      address={normalizedAddress}
      isOwnProfile={isOwnProfile}
      activeTab={requestedTab}
      onTabChange={nextTab => navigate({ pathname: `/profile/${normalizedAddress}/${nextTab}`, search })}
      // No tab segment in the URL → mobile renders the navigation root screen.
      hasExplicitTab={isValidTab(tab)}
      onExitTab={() => navigate({ pathname: `/profile/${normalizedAddress}`, search })}
      manageDocumentTitle
    />
  )
}

export { ProfilePage }
