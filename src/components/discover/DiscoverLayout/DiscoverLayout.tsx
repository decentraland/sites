import { Outlet } from 'react-router-dom'
import { DiscoverJumpInProvider } from '../DiscoverJumpInProvider'
import { PageContainer } from './DiscoverLayout.styled'

// NOTE: the shell renders no tab strip for now — only DISCOVER ships in the
// first release. /discover/communities and the pre-existing
// /social/communities/:id detail stay mounted in App.tsx so deep links keep
// working; add a tab strip here when the section is promoted in the IA.
// DiscoverJumpInProvider owns the single "JUMP IN → install first" DownloadModal
// shared by every card and detail surface under /discover/*.
function DiscoverLayout() {
  return (
    <DiscoverJumpInProvider>
      <PageContainer>
        <Outlet />
      </PageContainer>
    </DiscoverJumpInProvider>
  )
}

export { DiscoverLayout }
