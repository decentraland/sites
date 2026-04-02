import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useAnalytics } from '@dcl/hooks'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useLocale } from '../../intl/LocaleContext'
import { SectionViewedTrack, SegmentEvent } from '../../modules/segment'
import { assetUrl } from '../../utils/assetUrl'
// Module-level cache for notification type→component map from ui2.
// Lazy-loaded on first bell click so it doesn't affect initial bundle.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _notifComponentMap: Record<string, React.ComponentType<any>> | null = null
import {
  AccountIcon,
  BellIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CloseIcon,
  CopyIcon,
  DclLogo,
  ExternalLinkIcon,
  HamburgerIcon,
  LogoutIcon,
  SettingsIcon,
  ShoppingBagIcon,
  WearableIcon
} from './icons'
import { DROPDOWN_SECTIONS, MENU_CONFIG, USER_MENU_ITEMS } from './navbarConfig'
import type { DropdownSection } from './navbarConfig'
import {
  AvatarButton,
  AvatarFallback,
  AvatarImage,
  BellButton,
  DesktopDropdown,
  DesktopDropdownInner,
  DesktopDropdownItem,
  DesktopDropdownWrapper,
  DesktopTabLink,
  DesktopTabList,
  DesktopTabWithDropdown,
  HamburgerButton,
  LogoLink,
  MobileMenuAccordionHeader,
  MobileMenuItem,
  MobileMenuLink,
  MobileMenuOverlay,
  MobileMenuPanel,
  MobileMenuSubItem,
  MobileMenuSubItems,
  MobileUserCard,
  MobileUserCardAddress,
  MobileUserCardAddressLabel,
  MobileUserCardAvatar,
  MobileUserCardAvatarImage,
  MobileUserCardCopyButton,
  MobileUserCardInfo,
  MobileUserCardName,
  MobileUserCardTop,
  NavBarLeft,
  NavBarRight,
  NavBarRightGroup,
  NavBarRoot,
  NotificationBadge,
  NotificationDot,
  NotificationEmpty,
  NotificationHeader,
  NotificationItemContent,
  NotificationItemDescription,
  NotificationItemImage,
  NotificationItemTime,
  NotificationItemTitle,
  NotificationList,
  NotificationListItem,
  NotificationPanel,
  NotificationTitle,
  NotificationWrapper,
  SignInButton,
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
} from './LandingNavbar.styled'

interface NotificationItem {
  id: string
  read: boolean
  type: string
  timestamp: number
  metadata: Record<string, unknown>
}

type NotificationActiveTab = 'newest' | 'read'

interface NotificationsData {
  items: NotificationItem[]
  isLoading: boolean
  isOpen: boolean
  activeTab: NotificationActiveTab
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  onClose: (...args: unknown[]) => void
  onChangeTab: (e: unknown, tab: NotificationActiveTab) => void
}

interface LandingNavbarProps {
  isSignedIn: boolean
  isSigningIn: boolean
  isLandingPage?: boolean
  address?: string
  avatar?: { name?: string; avatar?: { snapshots?: { face256?: string; body?: string } } }
  notifications?: NotificationsData
  onClickSignIn: () => void
  onClickSignOut: () => void
}

const PEER_BASE_URL = 'https://peer.decentraland.org/content/contents/'

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatNotificationType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function resolveContentUrl(hash: string | undefined): string | undefined {
  if (!hash) return undefined
  if (hash.startsWith('http://') || hash.startsWith('https://')) return hash
  if (hash.startsWith('data:')) return hash
  return `${PEER_BASE_URL}${hash}`
}

const LandingNavbar = memo(function LandingNavbar({
  isSignedIn,
  isSigningIn,
  isLandingPage = false,
  address,
  avatar,
  notifications,
  onClickSignIn,
  onClickSignOut
}: LandingNavbarProps) {
  // On the landing page (/), show a minimal transparent navbar initially.
  // Once we know the user is signed in, transition to the full navbar.
  const showMinimalNavbar = isLandingPage && !isSignedIn
  const l = useFormatMessage()
  const { locale } = useLocale()
  const { isInitialized, track } = useAnalytics()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const trackNavbar = useCallback(
    (action: string) => {
      if (!isInitialized) return
      track(SegmentEvent.CLICK, { place: SectionViewedTrack.LANDING_NAVBAR, event: 'click', action })
    },
    [isInitialized, track]
  )
  const [mobileAccordion, setMobileAccordion] = useState<DropdownSection | null>(null)
  const [desktopDropdown, setDesktopDropdown] = useState<DropdownSection | null>(null)
  const [userCardOpen, setUserCardOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const navRef = useRef<HTMLElement>(null)
  const dropdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const unreadCount = notifications?.items?.filter(n => !n.read).length ?? 0

  const [notifMapLoaded, setNotifMapLoaded] = useState(!!_notifComponentMap)
  const notifOpenRef = useRef(false)

  const onClickNotificationBell = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (notifications?.onClick) {
        notifications.onClick(e)
      }
      notifOpenRef.current = !notifOpenRef.current
      setUserCardOpen(false)
      setDesktopDropdown(null)
      // Lazy-load notification type renderers from ui2 on first click
      if (!_notifComponentMap) {
        import('decentraland-ui2/dist/components/Notifications/utils').then(m => {
          _notifComponentMap = m.NotificationComponentByType
          setNotifMapLoaded(true)
        })
      }
    },
    [notifications]
  )

  const closeNotifications = useCallback(() => {
    if (notifOpenRef.current && notifications?.onClose) {
      notifications.onClose()
      notifOpenRef.current = false
    }
  }, [notifications])

  const resolvedFace = resolveContentUrl(avatar?.avatar?.snapshots?.face256)
  const fallbackFace = assetUrl('/avatar_face.webp')
  const [faceState, setFaceState] = useState<'loading' | 'loaded' | 'error'>('loading')

  useEffect(() => {
    if (!resolvedFace) {
      setFaceState('loading')
      return
    }
    // Reset to loading when URL changes (e.g. switching accounts)
    setFaceState('loading')
    const img = new Image()
    img.onload = () => setFaceState('loaded')
    img.onerror = () => setFaceState('error')
    img.src = resolvedFace
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [resolvedFace])

  const faceUrl = faceState === 'loaded' ? resolvedFace : faceState === 'error' ? fallbackFace : undefined
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

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => {
      if (!prev) {
        setDesktopDropdown(null)
        setUserCardOpen(false)
      }
      return !prev
    })
  }, [])

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
    setMobileAccordion(null)
  }, [])

  const toggleMobileAccordion = useCallback((section: DropdownSection) => {
    setMobileAccordion(prev => (prev === section ? null : section))
  }, [])

  const openDesktopDropdown = useCallback((section: DropdownSection) => {
    if (dropdownTimerRef.current) {
      clearTimeout(dropdownTimerRef.current)
      dropdownTimerRef.current = null
    }
    setDesktopDropdown(section)
    setUserCardOpen(false)
  }, [])

  const scheduleCloseDesktopDropdown = useCallback(() => {
    dropdownTimerRef.current = setTimeout(() => {
      setDesktopDropdown(null)
    }, 300)
  }, [])

  const closeDesktopDropdown = useCallback(() => {
    setDesktopDropdown(null)
  }, [])

  const toggleUserCard = useCallback(() => {
    setUserCardOpen(prev => {
      if (!prev) {
        setDesktopDropdown(null)
        setMobileMenuOpen(false)
        closeNotifications()
      }
      return !prev
    })
  }, [closeNotifications])

  const closeUserCard = useCallback(() => {
    setUserCardOpen(false)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (navRef.current && !navRef.current.contains(target)) {
        // Don't close if clicking inside the mobile user card
        const mobileCard = document.querySelector('[data-mobile-user-card]')
        if (mobileCard?.contains(target)) return
        closeDesktopDropdown()
        closeUserCard()
        closeNotifications()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [closeDesktopDropdown, closeUserCard, closeNotifications])

  // Fade out "Decentraland" name on scroll
  useEffect(() => {
    if (!showMinimalNavbar) return
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [showMinimalNavbar])

  // Close open panels on scroll
  useEffect(() => {
    const handleScroll = () => {
      closeUserCard()
      closeDesktopDropdown()
      closeNotifications()
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [closeUserCard, closeDesktopDropdown, closeNotifications])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeDesktopDropdown()
        closeUserCard()
        closeMobileMenu()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeDesktopDropdown, closeUserCard, closeMobileMenu])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const renderAvatar = useCallback(() => {
    if (faceUrl) {
      return <AvatarImage src={faceUrl} alt="" />
    }
    return <AvatarFallback />
  }, [faceUrl, userName])

  const renderMobileMenuContent = useCallback(() => {
    return (
      <>
        <MobileMenuItem>
          <MobileMenuLink href={MENU_CONFIG.whatsOn.url}>{l(MENU_CONFIG.whatsOn.labelKey)}</MobileMenuLink>
        </MobileMenuItem>

        {DROPDOWN_SECTIONS.map(section => {
          const config = MENU_CONFIG[section]
          const isExpanded = mobileAccordion === section

          return (
            <MobileMenuItem key={section}>
              <MobileMenuAccordionHeader onClick={() => toggleMobileAccordion(section)} aria-expanded={isExpanded}>
                {l(config.labelKey)}
                {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </MobileMenuAccordionHeader>

              <MobileMenuSubItems open={isExpanded}>
                {config.items?.map(item => (
                  <MobileMenuSubItem
                    key={item.labelKey}
                    href={item.url}
                    target={item.isExternal ? '_blank' : undefined}
                    rel={item.isExternal ? 'noopener noreferrer' : undefined}
                  >
                    {l(item.labelKey)}
                    {item.isExternal && <ExternalLinkIcon />}
                  </MobileMenuSubItem>
                ))}
              </MobileMenuSubItems>
            </MobileMenuItem>
          )
        })}
      </>
    )
  }, [l, mobileAccordion, toggleMobileAccordion])

  // Minimal navbar: transparent, only logo + sign in (no tabs, no blur, no shadow)
  if (showMinimalNavbar) {
    return (
      <NavBarRoot ref={navRef} className="minimal">
        <NavBarLeft style={{ gap: 16 }}>
          <LogoLink href="https://decentraland.org" aria-label="Decentraland Home">
            <DclLogo />
          </LogoLink>
          <img
            src={assetUrl('/dcl_name.svg')}
            alt="Decentraland"
            className="desktop-only"
            style={{
              height: 20,
              opacity: scrolled ? 0 : 1,
              transition: 'opacity 0.3s ease',
              pointerEvents: scrolled ? 'none' : 'auto'
            }}
          />
        </NavBarLeft>
        <NavBarRight>
          <SignInButton
            onClick={() => {
              trackNavbar('sign_in')
              onClickSignIn()
            }}
            disabled={isSigningIn}
          >
            {isSigningIn ? l('component.landing.navbar.signing_in') : l('component.landing.navbar.sign_in')}
          </SignInButton>
        </NavBarRight>
      </NavBarRoot>
    )
  }

  return (
    <>
      <NavBarRoot ref={navRef} className={isLandingPage && isSignedIn ? 'logged-landing' : ''}>
        <NavBarLeft>
          <LogoLink href="https://decentraland.org" aria-label="Decentraland Home">
            <DclLogo />
          </LogoLink>

          <DesktopTabList>
            <DesktopTabLink href={MENU_CONFIG.whatsOn.url}>{l(MENU_CONFIG.whatsOn.labelKey)}</DesktopTabLink>

            {DROPDOWN_SECTIONS.map(section => (
              <DesktopDropdownWrapper
                key={section}
                onMouseEnter={() => openDesktopDropdown(section)}
                onMouseLeave={scheduleCloseDesktopDropdown}
              >
                <DesktopTabWithDropdown
                  aria-expanded={desktopDropdown === section}
                  aria-haspopup="true"
                  onClick={() => {
                    const firstItem = MENU_CONFIG[section].items?.[0]
                    if (firstItem) window.open(firstItem.url, '_self')
                  }}
                >
                  {l(MENU_CONFIG[section].labelKey)}
                  <ChevronDownIcon
                    style={{
                      transform: desktopDropdown === section ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease'
                    }}
                  />
                </DesktopTabWithDropdown>

                {desktopDropdown === section && (
                  <DesktopDropdown>
                    <DesktopDropdownInner>
                      {MENU_CONFIG[section].items?.map(item => (
                        <DesktopDropdownItem
                          key={item.labelKey}
                          href={item.url}
                          target={item.isExternal ? '_blank' : undefined}
                          rel={item.isExternal ? 'noopener noreferrer' : undefined}
                        >
                          {l(item.labelKey)}
                          {item.isExternal && <ExternalLinkIcon />}
                        </DesktopDropdownItem>
                      ))}
                    </DesktopDropdownInner>
                  </DesktopDropdown>
                )}
              </DesktopDropdownWrapper>
            ))}
          </DesktopTabList>
        </NavBarLeft>

        <NavBarRight>
          {isSignedIn && (
            <NavBarRightGroup>
              <NotificationWrapper>
                <BellButton
                  onClick={onClickNotificationBell}
                  aria-label="Notifications"
                  aria-expanded={notifications?.isOpen}
                  className={unreadCount > 0 ? 'has-unread' : ''}
                >
                  <BellIcon />
                  {unreadCount > 0 && <NotificationBadge>{unreadCount > 9 ? '9+' : unreadCount}</NotificationBadge>}
                </BellButton>

                {notifications?.isOpen && (
                  <NotificationPanel onClick={e => e.stopPropagation()}>
                    <NotificationHeader>
                      <NotificationTitle>{l('component.landing.navbar.notifications_title')}</NotificationTitle>
                    </NotificationHeader>
                    <NotificationList>
                      {notifications.isLoading ? (
                        <NotificationEmpty>{l('component.landing.navbar.notifications_loading')}</NotificationEmpty>
                      ) : (
                        (() => {
                          const items = notifications.items
                          if (items.length === 0) {
                            return <NotificationEmpty>{l('component.landing.navbar.notifications_empty_new')}</NotificationEmpty>
                          }
                          return items.slice(0, 30).map(item => {
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            const Comp = _notifComponentMap?.[item.type]
                            if (Comp && notifMapLoaded) {
                              // Use ui2's full notification renderer (correct icon, title, description per type)
                              return (
                                <NotificationListItem key={item.id} style={{ padding: 0 }}>
                                  <Comp notification={item} locale={locale} />
                                </NotificationListItem>
                              )
                            }
                            // Fallback while ui2 components load or for unknown types
                            const meta = item.metadata as Record<string, string> | undefined
                            const title = meta?.title || meta?.nftName || formatNotificationType(item.type)
                            const description = meta?.description || meta?.message
                            const link = meta?.link || meta?.url
                            return (
                              <NotificationListItem
                                key={item.id}
                                onClick={() => link && window.open(link, '_blank', 'noopener')}
                                style={{ cursor: link ? 'pointer' : 'default' }}
                              >
                                <NotificationItemImage>
                                  <BellIcon />
                                </NotificationItemImage>
                                <NotificationItemContent>
                                  <NotificationItemTitle>{title}</NotificationItemTitle>
                                  {description && <NotificationItemDescription>{description}</NotificationItemDescription>}
                                  <NotificationItemTime>{formatTimeAgo(item.timestamp)}</NotificationItemTime>
                                </NotificationItemContent>
                                {!item.read && <NotificationDot className="unread" />}
                              </NotificationListItem>
                            )
                          })
                        })()
                      )}
                    </NotificationList>
                  </NotificationPanel>
                )}
              </NotificationWrapper>

              <UserCardWrapper>
                <AvatarButton onClick={toggleUserCard} aria-label="User menu" aria-expanded={userCardOpen} aria-haspopup="true">
                  {renderAvatar()}
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
                      {USER_MENU_ITEMS.map((item, i) => (
                        <UserCardMenuItem key={item.labelKey} href={item.url}>
                          {i === 0 && <AccountIcon />}
                          {i === 1 && <WearableIcon />}
                          {i === 2 && <SettingsIcon />}
                          {i === 3 && <ShoppingBagIcon />}
                          {l(item.labelKey)}
                        </UserCardMenuItem>
                      ))}
                      <UserCardDivider />
                      <UserCardLogout onClick={onClickSignOut}>
                        <LogoutIcon />
                        {l('component.landing.navbar.logout')}
                      </UserCardLogout>
                    </UserCardMenu>
                  </UserCard>
                )}
              </UserCardWrapper>
            </NavBarRightGroup>
          )}

          {!isSignedIn && (
            <SignInButton
              onClick={() => {
                trackNavbar('sign_in')
                onClickSignIn()
              }}
              disabled={isSigningIn}
            >
              {isSigningIn ? l('component.landing.navbar.signing_in') : l('component.landing.navbar.sign_in')}
            </SignInButton>
          )}

          <HamburgerButton
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
          </HamburgerButton>
        </NavBarRight>
      </NavBarRoot>

      <MobileMenuOverlay open={mobileMenuOpen} onClick={closeMobileMenu} />
      <MobileMenuPanel open={mobileMenuOpen} role="navigation" aria-label="Mobile navigation">
        {renderMobileMenuContent()}
      </MobileMenuPanel>

      {isSignedIn && userCardOpen && (
        <MobileUserCard data-mobile-user-card onClick={e => e.stopPropagation()}>
          <MobileUserCardTop>
            <MobileUserCardAvatar>{faceUrl ? <MobileUserCardAvatarImage src={faceUrl} alt="" /> : null}</MobileUserCardAvatar>
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
          <UserCardMenu>
            {USER_MENU_ITEMS.map((item, i) => (
              <UserCardMenuItem key={item.labelKey} href={item.url}>
                {i === 0 && <AccountIcon />}
                {i === 1 && <WearableIcon />}
                {i === 2 && <SettingsIcon />}
                {i === 3 && <ShoppingBagIcon />}
                {l(item.labelKey)}
              </UserCardMenuItem>
            ))}
            <UserCardDivider />
            <UserCardLogout onClick={onClickSignOut}>
              <LogoutIcon />
              {l('component.landing.navbar.logout')}
            </UserCardLogout>
          </UserCardMenu>
        </MobileUserCard>
      )}
    </>
  )
})

LandingNavbar.displayName = 'LandingNavbar'

export { LandingNavbar }
export type { LandingNavbarProps }
