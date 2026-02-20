import { useCallback, useMemo } from 'react'
import type { Address } from 'viem'
import { useTokenBalance, useWallet } from '@dcl/core-web3'
import { ChainId, Network } from '@dcl/schemas'
import { Env } from '@dcl/ui-env'
import {
  Box,
  Footer,
  FooterLanding,
  type ManaBalancesProps,
  Navbar,
  NavbarPages,
  type NavbarProps,
  SupportedLanguage
} from 'decentraland-ui2'
import { config, getEnv } from '../../config/env'
import { usePageNotifications } from '../../features/notifications/usePageNotifications'
import { useGetProfileQuery } from '../../features/profile/profile.client'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { redirectToAuth } from '../../utils/authRedirect'
import type { LayoutProps } from './Layout.types'

const isProd = config.is(Env.PRODUCTION)

const parseTokenBalance = (balance: string | null) => {
  if (balance === null) {
    return undefined
  }

  const parsed = Number(balance)
  return Number.isFinite(parsed) ? parsed : undefined
}

// eslint-disable-next-line react/prop-types
const Layout: React.FC<LayoutProps> = ({ children, activePage = '', withNavbar = true, withFooter = true }) => {
  const { address, isConnected, isConnecting, isDisconnecting, disconnect } = useWallet()

  const { identity } = useAuthIdentity()

  const { notificationProps } = usePageNotifications({
    identity,
    isConnected,
    locale: 'en'
  })

  const { balance: manaBalanceEthereum } = useTokenBalance({
    tokenAddress: getEnv('MANA_TOKEN_ADDRESS_ETHEREUM') as Address,
    chainId: isProd ? ChainId.ETHEREUM_MAINNET : ChainId.ETHEREUM_SEPOLIA
  })

  const { balance: manaBalanceMatic } = useTokenBalance({
    tokenAddress: getEnv('MANA_TOKEN_ADDRESS_MATIC') as Address,
    chainId: isProd ? ChainId.MATIC_MAINNET : ChainId.MATIC_AMOY
  })

  const { data: profile } = useGetProfileQuery(address ?? undefined, { skip: !address })
  const avatar = profile?.avatars?.[0]

  const manaBalances = useMemo(() => {
    if (!isConnected) {
      return {}
    }

    const balances: ManaBalancesProps['manaBalances'] = {}
    const ethereumBalance = parseTokenBalance(manaBalanceEthereum)
    const maticBalance = parseTokenBalance(manaBalanceMatic)

    if (ethereumBalance !== undefined) {
      balances[Network.ETHEREUM] = ethereumBalance
    }

    if (maticBalance !== undefined) {
      balances[Network.MATIC] = maticBalance
    }

    return balances
  }, [isConnected, manaBalanceEthereum, manaBalanceMatic])

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
        manaBalances: manaBalances as ManaBalancesProps['manaBalances'],
        notifications: notificationProps,
        onClickSignIn: handleSignIn,
        onClickSignOut: handleSignOut,
        onClickNavbarItem: (event: React.MouseEvent) => {
          const target = event.currentTarget as HTMLAnchorElement
          if (target?.href) {
            window.location.href = target.href
          }
        }
      }) as NavbarProps,
    [activePage, isConnected, isConnecting, isDisconnecting, address, avatar, manaBalances, notificationProps, handleSignIn, handleSignOut]
  )

  return (
    <Box>
      {withNavbar && <Navbar {...navbarProps} />}
      {children}
      {withFooter && <FooterLanding />}
      <Footer hideSocialNetworks={!!withFooter} languages={[{ code: SupportedLanguage.EN, name: 'English', flag: '🇺🇸' }]} />
    </Box>
  )
}

export { Layout }
