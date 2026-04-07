import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useAnalytics } from '@dcl/hooks'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { SectionViewedTrack, SegmentEvent } from '../../modules/segment'
import { assetUrl } from '../../utils/assetUrl'
import { CloseIcon, DclLogo, HamburgerIcon } from './icons'
import { MobileMenu } from './MobileMenu'
import type { DropdownSection } from './navbarConfig'
import { NavLinks } from './NavLinks'
import { NotificationBell } from './NotificationBell'
import type { NotificationsData } from './types'
import { UserCardPanel } from './UserCardPanel'
import { HamburgerButton, LogoLink, NavBarLeft, NavBarRight, NavBarRightGroup, NavBarRoot, SignInButton } from './LandingNavbar.styled'

interface LandingNavbarProps {
  isSignedIn: boolean
  isSigningIn: boolean
  isLandingPage?: boolean
  isLoadingProfile?: boolean
  address?: string
  avatar?: { name?: string; avatar?: { snapshots?: { face256?: string; body?: string } } }
  notifications?: NotificationsData
  onClickSignIn: () => void
  onClickSignOut: () => void
}

const LandingNavbar = memo(function LandingNavbar({
  isSignedIn,
  isSigningIn,
  isLandingPage = false,
  isLoadingProfile = false,
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
  const { isInitialized, track } = useAnalytics()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const trackNavbar = useCallback(
    (action: string) => {
      if (!isInitialized) return
      track(SegmentEvent.CLICK, { place: SectionViewedTrack.LANDING_NAVBAR, event: 'click', action })
    },
    [isInitialized, track]
  )
  const [desktopDropdown, setDesktopDropdown] = useState<DropdownSection | null>(null)
  const [userCardOpen, setUserCardOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const navRef = useRef<HTMLElement>(null)
  const dropdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const unreadCount = notifications?.items?.filter(n => !n.read).length ?? 0

  const onClickNotificationBell = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (notifications?.onClick) {
        notifications.onClick(e)
      }
      setUserCardOpen(false)
      setDesktopDropdown(null)
    },
    [notifications]
  )

  const closeNotifications = useCallback(() => {
    if (notifications?.isOpen && notifications?.onClose) {
      notifications.onClose()
    }
  }, [notifications])

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

          <NavLinks
            desktopDropdown={desktopDropdown}
            onOpenDropdown={openDesktopDropdown}
            onScheduleCloseDropdown={scheduleCloseDesktopDropdown}
          />
        </NavBarLeft>

        <NavBarRight>
          {isSignedIn && (
            <NavBarRightGroup>
              <NotificationBell notifications={notifications} onBellClick={onClickNotificationBell} unreadCount={unreadCount} />

              <UserCardPanel
                isLoadingProfile={isLoadingProfile}
                address={address}
                avatar={avatar}
                userCardOpen={userCardOpen}
                onToggleUserCard={toggleUserCard}
                onClickSignOut={onClickSignOut}
              />
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

      <MobileMenu open={mobileMenuOpen} onClose={closeMobileMenu} />
    </>
  )
})

LandingNavbar.displayName = 'LandingNavbar'

export { LandingNavbar }
export type { LandingNavbarProps }
