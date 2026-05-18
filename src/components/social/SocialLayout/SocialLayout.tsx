import { Outlet } from 'react-router-dom'
import { PageContainer } from './SocialLayout.styled'

// Communities tab is hidden for now — only DISCOVER ships in the first
// release. The /discover/communities + /discover/communities/:id routes are
// still mounted in App.tsx so existing deep links keep working, but the
// shell no longer surfaces a tab strip until the section is ready to be
// promoted in the IA.
function SocialLayout() {
  return (
    <PageContainer>
      <Outlet />
    </PageContainer>
  )
}

export { SocialLayout }
