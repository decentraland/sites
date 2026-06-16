import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CardGiftcardRoundedIcon from '@mui/icons-material/CardGiftcardRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded'
import { useGetProfileQuery } from '../../../features/profile/profile.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useWalletAddress } from '../../../hooks/useWalletAddress'
import { getAvatarBackgroundColor, getDisplayName } from '../../../utils/avatarColor'
import {
  Avatar,
  AvatarImage,
  BottomGroup,
  DeleteNavItem,
  LogoutButton,
  Nav,
  NavItem,
  SectionLabel,
  Sidebar,
  UserAddress,
  UserHeader,
  UserName
} from './AccountSidebar.styled'

// Catalyst content gateway for avatar snapshots — mirrors the navbar's resolver.
const PEER_CONTENT_URL = 'https://peer.decentraland.org/content/contents/'

const NAV_ITEMS = [
  { key: 'wallets', path: '/account/wallets', icon: <AccountBalanceWalletRoundedIcon fontSize="small" /> },
  { key: 'notifications', path: '/account/notifications', icon: <NotificationsRoundedIcon fontSize="small" /> },
  { key: 'credits', path: '/account/credits', icon: <CardGiftcardRoundedIcon fontSize="small" /> }
] as const

interface AccountSidebarProps {
  address: string
}

const resolveFaceUrl = (hash: string | undefined): string | undefined => {
  if (!hash) return undefined
  if (hash.startsWith('http://') || hash.startsWith('https://') || hash.startsWith('data:')) return hash
  return `${PEER_CONTENT_URL}${hash}`
}

const AccountSidebar = ({ address }: AccountSidebarProps) => {
  const t = useFormatMessage()
  const { pathname } = useLocation()
  const { disconnect } = useWalletAddress()
  const { data: profile } = useGetProfileQuery(address)

  const avatar = profile?.avatars?.[0]
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`
  const displayName = avatar?.name || shortAddress
  const faceUrl = resolveFaceUrl(avatar?.avatar?.snapshots?.face256)

  // Deterministic seeded background (ADR-292) once the profile resolves a name; falls back to
  // the default until then so the empty avatar doesn't flash a random hue.
  const backgroundColor = useMemo(
    () =>
      avatar?.name
        ? getAvatarBackgroundColor(getDisplayName({ name: avatar.name, hasClaimedName: avatar.hasClaimedName, ethAddress: address }))
        : undefined,
    [avatar?.name, avatar?.hasClaimedName, address]
  )

  return (
    <Sidebar component="nav" aria-label={t('account.nav.section_label')}>
      <UserHeader>
        <Avatar style={backgroundColor ? { backgroundColor } : undefined}>{faceUrl ? <AvatarImage src={faceUrl} alt="" /> : null}</Avatar>
        <UserName title={displayName}>{displayName}</UserName>
        <UserAddress>{shortAddress}</UserAddress>
      </UserHeader>

      <SectionLabel>{t('account.nav.section_label')}</SectionLabel>
      <Nav>
        {NAV_ITEMS.map(({ key, path, icon }) => {
          const active = pathname === path || pathname.startsWith(`${path}/`)
          return (
            <NavItem key={key} to={path} $active={active} data-role="account-nav-item">
              {icon}
              {t(`account.nav.${key}`)}
            </NavItem>
          )
        })}
      </Nav>

      <BottomGroup>
        <DeleteNavItem
          to="/account/delete"
          $active={pathname === '/account/delete' || pathname.startsWith('/account/delete/')}
          data-role="account-nav-delete"
        >
          <DeleteOutlineRoundedIcon fontSize="small" />
          {t('account.nav.delete')}
        </DeleteNavItem>
        <LogoutButton type="button" onClick={disconnect} data-role="account-logout">
          <LogoutRoundedIcon fontSize="small" />
          {t('account.nav.logout')}
        </LogoutButton>
      </BottomGroup>
    </Sidebar>
  )
}

export { AccountSidebar }
