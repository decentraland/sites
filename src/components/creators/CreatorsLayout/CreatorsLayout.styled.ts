import { Box, styled } from 'decentraland-ui2'

// Same radial purple gradient the other heavy-tier landing surfaces use
// (DiscoverLayout, CommunityDetailPage) so /creators reads as native chrome.
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  paddingTop: 64,
  background: 'radial-gradient(103.89% 95.21% at 95.21% 9.85%, #7434B1 0%, #481C6C 37.11%, #2B1040 100%)',
  [theme.breakpoints.up('md')]: { paddingTop: 96 }
}))

export { PageContainer }
