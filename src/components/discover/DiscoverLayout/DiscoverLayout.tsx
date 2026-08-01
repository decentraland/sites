import { Outlet } from 'react-router-dom'
import { PageContainer } from './DiscoverLayout.styled'

// NOTE: the shell renders no tab strip for now — only DISCOVER ships in the
// first release. /discover/communities and the pre-existing
// /social/communities/:id detail stay mounted in App.tsx so deep links keep
// working; add a tab strip here when the section is promoted in the IA.
function DiscoverLayout() {
  return (
    <PageContainer>
      <Outlet />
    </PageContainer>
  )
}

export { DiscoverLayout }
