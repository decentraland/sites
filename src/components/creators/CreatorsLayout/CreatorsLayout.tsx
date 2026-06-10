import { Outlet } from 'react-router-dom'
import { PageContainer } from './CreatorsLayout.styled'

// Wraps every /creators/* route. Provides the navbar clearance + shared
// gradient; individual pages render their own headers. Mirrors DiscoverLayout.
function CreatorsLayout() {
  return (
    <PageContainer>
      <Outlet />
    </PageContainer>
  )
}

export { CreatorsLayout }
