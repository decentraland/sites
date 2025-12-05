import { Box, Footer, Navbar } from 'decentraland-ui2'
import type { LayoutProps } from './Layout.types'

// eslint-disable-next-line react/prop-types
const Layout: React.FC<LayoutProps> = ({ children, activePage = '', withNavbar = true, withFooter = true }) => {
  const isConnected = false
  const isConnecting = false
  const address = null
  const handleClickSignIn = () => {}
  const handleClickSignOut = () => {}

  return (
    <Box>
      {withNavbar && (
        <Navbar
          activePage={activePage}
          isSignedIn={isConnected}
          isSigningIn={isConnecting}
          address={address || undefined}
          onClickSignIn={handleClickSignIn}
          onClickSignOut={handleClickSignOut}
        />
      )}
      {children}
      {withFooter && <Footer />}
    </Box>
  )
}

export { Layout }
