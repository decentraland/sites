import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useWallet } from '@dcl/core-web3'
import { usePageTracking } from '@dcl/hooks'
import { Box, Footer, Navbar, NavbarPages, type NavbarProps } from 'decentraland-ui2'
import { usePageNotifications } from '../../features/notifications/usePageNotifications'
import { useGetProfileQuery } from '../../features/profile/profile.client'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { redirectToAuth } from '../../utils/authRedirect'
import type { LayoutProps } from './Layout.types'

const STANDALONE_PATHS = ['/marketplace', '/builder', '/auth']

function resolveActivePage(pathname: string): string {
  if (pathname.startsWith('/events')) return NavbarPages.EXPLORE
  return NavbarPages.EXPLORE
}

// eslint-disable-next-line react/prop-types
const Layout: React.FC<LayoutProps> = ({ children, withNavbar = true, withFooter = true }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { address, isConnected, isConnecting, isDisconnecting, disconnect } = useWallet()
  usePageTracking(location.pathname)

  const { identity } = useAuthIdentity()

  const { notificationProps } = usePageNotifications({
    identity,
    isConnected,
    locale: 'en'
  })

  const { data: profile } = useGetProfileQuery(address ?? undefined, { skip: !address })
  const avatar = profile?.avatars?.[0]

  const activePage = useMemo(() => resolveActivePage(location.pathname), [location.pathname])

  const handleSignIn = useCallback(() => {
    const currentPath = window.location.pathname + window.location.search
    redirectToAuth(currentPath)
  }, [])

  const handleSignOut = useCallback(() => {
    disconnect()
  }, [disconnect])

  const handleClickNavbarItem = useCallback(
    (event: React.MouseEvent<HTMLElement>, { url, isExternal }: { url?: string; isExternal?: boolean }) => {
      if (!url || isExternal) return

      if (STANDALONE_PATHS.some(p => url.includes(p))) return

      event.preventDefault()
      navigate(url)
    },
    [navigate]
  )

  const navbarProps = useMemo(
    () =>
      ({
        activePage,
        isSignedIn: isConnected,
        isSigningIn: isConnecting,
        isDisconnecting,
        address: address || undefined,
        avatar,
        notifications: notificationProps,
        onClickSignIn: handleSignIn,
        onClickSignOut: handleSignOut,
        onClickNavbarItem: handleClickNavbarItem
      }) as NavbarProps,
    [
      activePage,
      isConnected,
      isConnecting,
      isDisconnecting,
      address,
      avatar,
      notificationProps,
      handleSignIn,
      handleSignOut,
      handleClickNavbarItem
    ]
  )

  return (
    <Box>
      {withNavbar && <Navbar {...navbarProps} />}
      {children}
      {withFooter && <Footer />}
    </Box>
  )
}

export { Layout }
