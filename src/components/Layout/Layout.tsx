import { useCallback, useMemo } from 'react'
import { useWallet } from '@dcl/core-web3'
import { Box, Footer, Navbar, NavbarPages, type NavbarProps } from 'decentraland-ui2'
import { useGetProfileQuery } from '../../features/profile/profile.client'
import { redirectToAuth } from '../../utils/authRedirect'
import type { LayoutProps } from './Layout.types'

// eslint-disable-next-line react/prop-types
const Layout: React.FC<LayoutProps> = ({ children, activePage = '', withNavbar = true, withFooter = true }) => {
  const { address, isConnected, isConnecting, isDisconnecting, disconnect } = useWallet()

  const { data: profile } = useGetProfileQuery(address ?? undefined, { skip: !address })
  const avatar = profile?.avatars?.[0]

  const handleSignIn = useCallback(() => {
    const currentPath = window.location.pathname + window.location.search
    redirectToAuth(currentPath)
  }, [])

  const handleSignOut = useCallback(() => {
    disconnect()
  }, [disconnect])

  const navbarProps = useMemo(
    () =>
      ({
        activePage: activePage || NavbarPages.EXPLORE,
        isSignedIn: isConnected,
        isSigningIn: isConnecting,
        isDisconnecting,
        address: address || undefined,
        avatar,
        onClickSignIn: handleSignIn,
        onClickSignOut: handleSignOut
      }) as NavbarProps,
    [activePage, isConnected, isConnecting, isDisconnecting, address, avatar, handleSignIn, handleSignOut]
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
