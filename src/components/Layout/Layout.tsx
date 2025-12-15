import { Box, Footer, Navbar } from 'decentraland-ui2'
import type { LayoutProps } from './Layout.types'

// eslint-disable-next-line react/prop-types
const Layout: React.FC<LayoutProps> = ({ children, activePage = '', withNavbar = true, withFooter = true }) => {
  // TODO: add new auth logic from @dcl/core-web3
  const isConnected = false
  const isConnecting = false
  const address = null
  const authorize = () => {}
  const disconnect = () => {}

  return (
    <Box>
      {withNavbar && (
        <Navbar
          activePage={activePage}
          isSignedIn={isConnected}
          isSigningIn={isConnecting}
          address={address || undefined}
          onClickSignIn={authorize}
          onClickSignOut={disconnect}
        />
      )}
      {children}
      {withFooter && <Footer />}
    </Box>
  )
}

export { Layout }
