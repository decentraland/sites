import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { NavBar, NavButton, NavList, PageContainer } from './SocialLayout.styled'

const ROUTE_HOME = '/social'
const ROUTE_COMMUNITIES = '/social/communities'

// Returns which top-level tab the current URL belongs to. Scene detail pages
// (/social/place/*, /social/world/*) keep the home tab highlighted so users
// feel "inside" the social section. Always navigates on click — even back
// to the same tab — so clicking the tab from a scene detail returns to the
// landing grid.
function resolveActiveTab(pathname: string): string {
  if (pathname.startsWith('/social/communities')) return ROUTE_COMMUNITIES
  return ROUTE_HOME
}

function SocialLayout() {
  const t = useFormatMessage()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const active = resolveActiveTab(pathname)

  return (
    <PageContainer>
      <NavBar>
        <NavList>
          <NavButton type="button" $active={active === ROUTE_HOME} onClick={() => navigate(ROUTE_HOME)}>
            {t('social.nav.live')}
          </NavButton>
          <NavButton type="button" $active={active === ROUTE_COMMUNITIES} onClick={() => navigate(ROUTE_COMMUNITIES)}>
            {t('social.nav.communities')}
          </NavButton>
        </NavList>
      </NavBar>
      <Outlet />
    </PageContainer>
  )
}

export { SocialLayout }
