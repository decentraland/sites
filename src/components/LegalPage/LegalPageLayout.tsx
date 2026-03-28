/* eslint-disable react/prop-types */
import { type ComponentType, memo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import BalanceIcon from '@mui/icons-material/Balance'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ExploreIcon from '@mui/icons-material/Explore'
// eslint-disable-next-line @typescript-eslint/naming-convention
import FavoriteIcon from '@mui/icons-material/Favorite'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ParkIcon from '@mui/icons-material/Park'
// eslint-disable-next-line @typescript-eslint/naming-convention
import RedeemIcon from '@mui/icons-material/Redeem'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ShieldIcon from '@mui/icons-material/Shield'
// eslint-disable-next-line @typescript-eslint/naming-convention
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import type { LegalPageLayoutProps } from './LegalPage.types'
import { ContentArea, DocumentTitle, LayoutGrid, PageContainer, SidebarContainer, SidebarLink, TOCList } from './LegalPage.styled'

const SIDEBAR_PAGES: { label: string; slug: string; icon: ComponentType }[] = [
  { label: 'Logo and Name', slug: '/brand', icon: FavoriteIcon },
  { label: 'Content Policy', slug: '/content', icon: ParkIcon },
  { label: 'Code of Ethics', slug: '/ethics', icon: BalanceIcon },
  { label: 'Rewards Program', slug: '/rewards-terms', icon: CardGiftcardIcon },
  { label: 'Security', slug: '/security', icon: ShieldIcon },
  { label: 'Privacy Policy', slug: '/privacy', icon: VpnKeyIcon },
  { label: 'Referral', slug: '/referral-terms', icon: RedeemIcon },
  { label: 'Terms of Use', slug: '/terms', icon: ExploreIcon }
]

const LegalPageLayout = memo<LegalPageLayoutProps>(({ title, activeSlug, tableOfContents, children }) => {
  const navigate = useNavigate()

  const handleSidebarClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
      event.preventDefault()
      navigate(slug)
    },
    [navigate]
  )

  return (
    <PageContainer>
      <LayoutGrid>
        <SidebarContainer>
          {SIDEBAR_PAGES.map(page => (
            <SidebarLink
              key={page.slug}
              href={page.slug}
              active={page.slug === activeSlug}
              onClick={event => handleSidebarClick(event, page.slug)}
            >
              <page.icon />
              {page.label}
            </SidebarLink>
          ))}
        </SidebarContainer>

        <ContentArea>
          <DocumentTitle>{title}</DocumentTitle>

          {tableOfContents.length > 0 && (
            <TOCList>
              {tableOfContents.map(item => (
                <li key={item.id} style={item.depth ? { paddingLeft: `${item.depth}rem` } : undefined}>
                  <a href={`#${item.id}`}>{item.label}</a>
                </li>
              ))}
            </TOCList>
          )}

          {children}
        </ContentArea>
      </LayoutGrid>
    </PageContainer>
  )
})

LegalPageLayout.displayName = 'LegalPageLayout'

export { LegalPageLayout }
