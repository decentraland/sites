import { Box, styled } from 'decentraland-ui2'

// Background tuned to the "Places - Desktop" Figma: a bright purple band in
// the upper-middle of the page (behind the Live Now / Featured rails) fading
// into near-black at the bottom where the Explore grid lives.
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  paddingTop: 64,
  // Sampled from the Figma "Places - Desktop" page background (1850:43350):
  // a center-bright radial (vivid #8B38B2 core ~28% down the page) falling to
  // deep #2B0A3B at the edges. Every toolbar surface and the modal backdrop
  // are translucent fills, so this gradient underneath is what makes them
  // read like the design.
  background: '#2B0A3B radial-gradient(65% 130% at 50% 28%, #8B38B2 0%, #6B2A8C 30%, #45155F 60%, #2B0A3B 100%) no-repeat',
  [theme.breakpoints.up('md')]: { paddingTop: 96 }
}))

export { PageContainer }
