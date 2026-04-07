import { memo, useCallback, useState } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { assetUrl } from '../../../utils/assetUrl'
import { AccountIcon, CopyIcon, LogoutIcon, SettingsIcon, ShoppingBagIcon, WearableIcon } from '../icons'
import {
  AvatarButton,
  AvatarImage,
  MobileUserCard,
  MobileUserCardAddress,
  MobileUserCardAddressLabel,
  MobileUserCardAvatar,
  MobileUserCardCopyButton,
  MobileUserCardInfo,
  MobileUserCardName,
  MobileUserCardTop,
  UserCard,
  UserCardAddress,
  UserCardAddressLabel,
  UserCardAvatarBody,
  UserCardAvatarContainer,
  UserCardCopyButton,
  UserCardDivider,
  UserCardLogout,
  UserCardMenu,
  UserCardMenuItem,
  UserCardName,
  UserCardWrapper
} from '../LandingNavbar.styled'
import { USER_MENU_ITEMS } from '../navbarConfig'
import type { UserCardPanelProps } from './UserCardPanel.types'

const ICON_MAP: Record<string, React.FC> = {
  account: AccountIcon,
  wearable: WearableIcon,
  settings: SettingsIcon,
  shopping: ShoppingBagIcon
}

const PEER_BASE_URL = 'https://peer.decentraland.org/content/contents/'

function resolveContentUrl(hash: string | undefined): string | undefined {
  if (!hash) return undefined
  if (hash.startsWith('http://') || hash.startsWith('https://')) return hash
  if (hash.startsWith('data:')) return hash
  return `${PEER_BASE_URL}${hash}`
}

const UserCardPanel = memo(function UserCardPanel({
  isLoadingProfile,
  address,
  avatar,
  userCardOpen,
  onToggleUserCard,
  onClickSignOut
}: UserCardPanelProps) {
  const l = useFormatMessage()

  const resolvedFace = resolveContentUrl(avatar?.avatar?.snapshots?.face256)
  const faceUrl = resolvedFace ?? assetUrl('/avatar_face.webp')
  const [loadedUrl, setLoadedUrl] = useState<string>()
  const faceLoaded = loadedUrl === faceUrl
  const bodyUrl = resolveContentUrl(avatar?.avatar?.snapshots?.body)
  const userName = avatar?.name || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '')
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''

  const [addressCopied, setAddressCopied] = useState(false)

  const copyAddress = useCallback(() => {
    if (address) {
      navigator.clipboard
        .writeText(address)
        .then(() => {
          setAddressCopied(true)
          setTimeout(() => setAddressCopied(false), 2000)
        })
        .catch(() => {
          // Silently fail if clipboard API is not available
        })
    }
  }, [address])

  const renderAvatar = () => (
    <AvatarImage
      src={faceUrl}
      alt=""
      onLoad={() => setLoadedUrl(faceUrl)}
      onError={() => setLoadedUrl(faceUrl)}
      style={{ opacity: faceLoaded ? 1 : 0 }}
    />
  )

  const renderMenuItems = () => (
    <>
      {USER_MENU_ITEMS.map(item => {
        const Icon = ICON_MAP[item.icon]
        return (
          <UserCardMenuItem key={item.labelKey} href={item.url}>
            {Icon && <Icon />}
            {l(item.labelKey)}
          </UserCardMenuItem>
        )
      })}
      <UserCardDivider />
      <UserCardLogout onClick={onClickSignOut}>
        <LogoutIcon />
        {l('component.landing.navbar.logout')}
      </UserCardLogout>
    </>
  )

  return (
    <>
      {/* Desktop avatar button + user card */}
      <UserCardWrapper>
        <AvatarButton
          onClick={onToggleUserCard}
          aria-label="User menu"
          aria-expanded={userCardOpen}
          aria-haspopup="true"
          className={isLoadingProfile ? 'loading' : undefined}
        >
          {!isLoadingProfile && renderAvatar()}
        </AvatarButton>

        {userCardOpen && (
          <UserCard onClick={e => e.stopPropagation()}>
            <UserCardAvatarContainer>{bodyUrl ? <UserCardAvatarBody src={bodyUrl} alt="" /> : null}</UserCardAvatarContainer>
            <UserCardMenu>
              <div style={{ paddingLeft: 16, paddingBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <UserCardName title={userName}>{userName}</UserCardName>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <UserCardAddressLabel>{l('component.landing.navbar.wallet_address')}</UserCardAddressLabel>
                  <UserCardAddress>
                    {addressCopied ? l('component.landing.navbar.address_copied') : shortAddress}
                    <UserCardCopyButton onClick={copyAddress} aria-label="Copy address">
                      <CopyIcon />
                    </UserCardCopyButton>
                  </UserCardAddress>
                </div>
              </div>
              <UserCardDivider />
              {renderMenuItems()}
            </UserCardMenu>
          </UserCard>
        )}
      </UserCardWrapper>

      {/* Mobile user card (rendered outside navbar root via portal-like placement) */}
      {userCardOpen && (
        <MobileUserCard data-mobile-user-card onClick={e => e.stopPropagation()}>
          <MobileUserCardTop>
            <MobileUserCardAvatar className={isLoadingProfile ? 'loading' : undefined}>
              {!isLoadingProfile && renderAvatar()}
            </MobileUserCardAvatar>
            <MobileUserCardInfo>
              <MobileUserCardName title={userName}>{userName}</MobileUserCardName>
              <MobileUserCardAddressLabel>{l('component.landing.navbar.wallet_address')}</MobileUserCardAddressLabel>
              <MobileUserCardAddress>
                {addressCopied ? l('component.landing.navbar.address_copied') : shortAddress}
                <MobileUserCardCopyButton onClick={copyAddress} aria-label="Copy address">
                  <CopyIcon />
                </MobileUserCardCopyButton>
              </MobileUserCardAddress>
            </MobileUserCardInfo>
          </MobileUserCardTop>
          <UserCardDivider />
          <UserCardMenu>{renderMenuItems()}</UserCardMenu>
        </MobileUserCard>
      )}
    </>
  )
})

UserCardPanel.displayName = 'UserCardPanel'

export { UserCardPanel }
