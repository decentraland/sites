import { useCallback, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import { Address, Tooltip } from 'decentraland-ui2'
import { useGetProfileQuery } from '../../../features/profile/profile.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useWalletAddress } from '../../../hooks/useWalletAddress'
import { getAvatarBackgroundColor, getDisplayName } from '../../../utils/avatarColor'
import {
  AddressRow,
  Avatar,
  AvatarImage,
  BottomGroup,
  CopyButton,
  DeleteNavItem,
  Divider,
  LogoutButton,
  Nav,
  NavChevron,
  NavItem,
  SectionLabel,
  Sidebar,
  UserHeader,
  UserInfo,
  UserName
} from './AccountSidebar.styled'

// Catalyst content gateway for avatar snapshots — mirrors the navbar's resolver.
const PEER_CONTENT_URL = 'https://peer.decentraland.org/content/contents/'

const NAV_ITEMS = [
  { key: 'wallets', path: '/account/wallets', icon: <AccountBalanceWalletOutlinedIcon fontSize="small" /> },
  { key: 'notifications', path: '/account/notifications', icon: <NotificationsNoneOutlinedIcon fontSize="small" /> },
  { key: 'credits', path: '/account/credits', icon: <CardGiftcardOutlinedIcon fontSize="small" /> }
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
  const [copied, setCopied] = useState(false)

  const avatar = profile?.avatars?.[0]
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`
  const displayName = avatar?.name || shortAddress
  const faceUrl = resolveFaceUrl(avatar?.avatar?.snapshots?.face256)

  // Deterministic seeded background (ADR-292) once the profile resolves a name.
  const backgroundColor = useMemo(
    () =>
      avatar?.name
        ? getAvatarBackgroundColor(getDisplayName({ name: avatar.name, hasClaimedName: avatar.hasClaimedName, ethAddress: address }))
        : undefined,
    [avatar?.name, avatar?.hasClaimedName, address]
  )

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(address)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => {
        // Clipboard API unavailable — the address stays visible to copy manually.
      })
  }, [address])

  return (
    <Sidebar component="nav" aria-label={t('account.nav.section_label')}>
      <UserHeader>
        <Avatar style={backgroundColor ? { backgroundColor } : undefined}>{faceUrl ? <AvatarImage src={faceUrl} alt="" /> : null}</Avatar>
        <UserInfo>
          <UserName title={displayName}>{displayName}</UserName>
          <AddressRow>
            <AccountBalanceWalletOutlinedIcon fontSize="small" />
            <Address value={address} shorten />
            <Tooltip title={copied ? t('account.copied') : t('account.copy')} placement="top">
              <CopyButton type="button" onClick={handleCopy} aria-label={t('account.copy')} data-role="account-copy-address">
                <ContentCopyOutlinedIcon fontSize="small" />
              </CopyButton>
            </Tooltip>
          </AddressRow>
        </UserInfo>
      </UserHeader>

      <Divider />

      <SectionLabel>{t('account.nav.section_label')}</SectionLabel>
      <Nav>
        {NAV_ITEMS.map(({ key, path, icon }) => {
          const active = pathname === path || pathname.startsWith(`${path}/`)
          return (
            <NavItem key={key} to={path} $active={active} data-role="account-nav-item">
              {icon}
              {t(`account.nav.${key}`)}
              <NavChevron>
                <ChevronRightIcon fontSize="small" />
              </NavChevron>
            </NavItem>
          )
        })}
      </Nav>

      <BottomGroup>
        <Divider />
        {/* NOTE: Delete is only meaningful for thirdweb (email/social-OTP) wallets. Per product, it
            stays visible for everyone until the deletion flow is confirmed working end-to-end; the
            OTP-only gating is a pending follow-up. */}
        <DeleteNavItem
          to="/account/delete"
          $active={pathname === '/account/delete' || pathname.startsWith('/account/delete/')}
          data-role="account-nav-delete"
        >
          <DeleteOutlineOutlinedIcon fontSize="small" />
          {t('account.nav.delete')}
          <NavChevron>
            <ChevronRightIcon fontSize="small" />
          </NavChevron>
        </DeleteNavItem>
        <Divider />
        <LogoutButton type="button" onClick={disconnect} data-role="account-logout">
          <LogoutOutlinedIcon fontSize="small" />
          {t('account.nav.logout')}
        </LogoutButton>
      </BottomGroup>
    </Sidebar>
  )
}

export { AccountSidebar }
