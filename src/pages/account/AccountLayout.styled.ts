import { Box, Typography, styled } from 'decentraland-ui2'

// Figma 322:101466 — Account Settings sits on the same brand violet radial gradient as the
// profile area (mirrors ProfileLayout). Full-bleed background wrapper; the centred column
// renders above it via zIndex.
const AccountLayoutRoot = styled(Box, { shouldForwardProp: prop => prop !== '$dashboard' })<{ $dashboard?: boolean }>(
  ({ theme, $dashboard }) => ({
    position: 'relative',
    // Flex column so a full-height child (the mobile dashboard sidebar) can grow to fill the
    // viewport leftover; block children are unaffected (they stretch the same as before).
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    minHeight: '100vh',
    // Keep the top/bottom padding inside the 100vh budget so the page is exactly one viewport tall when
    // the content is short — otherwise the padding is added on top of 100vh and forces a needless scroll.
    boxSizing: 'border-box',
    // Clearance below the fixed navbar (64px mobile / 92px desktop). NOTE: section screens add a 24px
    // gap below the mobile navbar (88px) so the content no longer sits flush against it; the mobile
    // dashboard (the full-screen menu, Figma 776:69124) stays flush at 64px by design. Desktop keeps
    // the Figma 322:101467 spacing (content at y=151 → a 59px gap below the 92px navbar).
    paddingTop: $dashboard ? 64 : 88,
    // The mobile dashboard (Figma 776:69124) is a full-screen panel flush with the bottom edge, so
    // it drops the resting bottom padding that the section screens keep for scroll breathing room.
    paddingBottom: $dashboard ? 0 : theme.spacing(8),
    background: 'radial-gradient(123.58% 82% at 9.01% 25.79%, #7434B1 0%, #481C6C 37.11%, #2B1040 100%)',
    isolation: 'isolate',
    [theme.breakpoints.up('md')]: {
      paddingTop: 151
    }
  })
)

const AccountPageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  // Full-width, left-aligned: the sidebar reads as a left rail hugging the edge instead of a
  // centered column (Figma dashboard layout).
  maxWidth: 'none',
  margin: 0,
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: theme.spacing(3),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(3)
  }
}))

const AccountContent = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  width: '100%',
  padding: theme.spacing(2),
  // Align the content's top edge with the sidebar's (both flush to the page container) — no extra
  // top padding on desktop, or the panel sits lower than the sidebar.
  [theme.breakpoints.up('md')]: {
    padding: 0
  }
}))

// Mobile section detail (Figma 783:73199): full-width column with a back/close header above the
// active section's content. No sidebar — the dashboard lives on the /account index route.
const MobileSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2)
}))

const MobileSectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  paddingBottom: theme.spacing(2)
}))

const MobileBackButton = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  border: 'none',
  background: 'none',
  padding: 0,
  cursor: 'pointer',
  color: '#FCFCFC',
  fontSize: 18,
  fontWeight: 600,
  ['& .MuiSvgIcon-root']: {
    fontSize: 16
  }
}))

const MobileCloseButton = styled('button')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'none',
  padding: 0,
  cursor: 'pointer',
  color: '#FCFCFC'
}))

const SignInPrompt = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(3),
  textAlign: 'center',
  minHeight: '50vh',
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2)
}))

const SignInTitle = styled(Typography)(() => ({
  fontWeight: 600,
  color: '#FCFCFC'
}))

export {
  AccountContent,
  AccountLayoutRoot,
  AccountPageContainer,
  MobileBackButton,
  MobileCloseButton,
  MobileSection,
  MobileSectionHeader,
  SignInPrompt,
  SignInTitle
}
