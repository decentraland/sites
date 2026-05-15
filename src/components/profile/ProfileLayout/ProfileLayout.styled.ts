import { Box, styled } from 'decentraland-ui2'

const LayoutRoot = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  minHeight: '100vh',
  paddingTop: 64,
  paddingBottom: theme.spacing(8),
  background: 'radial-gradient(123.58% 82% at 9.01% 25.79%, #7434B1 0%, #481C6C 37.11%, #2B1040 100%)',
  isolation: 'isolate',
  [theme.breakpoints.up('md')]: {
    paddingTop: 96
  }
}))

const ContentArea = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  width: '100%',
  // Cap the card frame at the Figma desktop spec (`ProfileCard0 = 1650 × 930`) so wide
  // viewports (1920 / 2560 / 4K) centre the surface instead of stretching the body grid
  // to the full window width.
  maxWidth: 1650,
  marginLeft: 'auto',
  marginRight: 'auto',
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.up('md')]: {
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4)
  }
}))

const ProfileCard = styled(Box)({
  position: 'relative',
  width: '100%',
  display: 'flex',
  flexDirection: 'column'
})

const TabsArea = styled(Box)({
  width: '100%'
})

const BodySplit = styled(Box, {
  shouldForwardProp: prop => prop !== '$hasAside' && prop !== '$showAside'
})<{ $hasAside: boolean; $showAside: boolean }>(({ theme, $hasAside, $showAside }) => {
  // Figma 290:41669 caps the avatar/wearable-preview column at ~390px, but
  // some avatars (wings, oversized props) need more room — we give the aside
  // up to 500px and let `AsideArea` overflow visible so anything wider spills
  // into the body area and sits behind the InfoSurface cards (which carry a
  // semi-opaque bg). When `hasAside` is false (My Profile w/o overview) there
  // is no aside child, so a single-column grid keeps BodyArea full-width. On
  // non-overview tabs the 2-col grid animates to `'0px 1fr'` so BodyArea
  // slides over the hidden aside slot.
  let gridTemplateColumns = '1fr'
  if ($hasAside) {
    gridTemplateColumns = $showAside ? 'minmax(280px, 500px) 1fr' : '0px 1fr'
  }
  return {
    display: 'grid',
    gridTemplateColumns,
    transition: 'grid-template-columns 320ms cubic-bezier(0.4, 0, 0.2, 1)',
    flex: '1 1 auto',
    width: '100%',
    minHeight: 0,
    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: '1fr',
      transition: 'none'
    }
  }
})

const AsideArea = styled(Box, {
  shouldForwardProp: prop => prop !== '$showAside'
})<{ $showAside: boolean }>(({ theme, $showAside }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: 500,
  minHeight: 480,
  // Visible overflow lets oversized avatars (wings, hats) spill past the
  // column boundary; BodyArea sits next in DOM order so its InfoSurface cards
  // paint on top.
  overflow: 'visible',
  opacity: $showAside ? 1 : 0,
  transition: 'opacity 240ms cubic-bezier(0.4, 0, 0.2, 1)',
  [theme.breakpoints.down('md')]: {
    maxWidth: '100%',
    minHeight: $showAside ? 320 : 0
  }
}))

const BodyArea = styled(Box)(({ theme }) => ({
  flex: '1 1 auto',
  padding: theme.spacing(3),
  // Internal scroll keeps the profile header + tabs pinned in modal contexts
  // (Paper has a constrained maxHeight). On the standalone /profile route the
  // page scrolls instead, so this only kicks in when the parent is shorter
  // than the body content.
  overflow: 'auto',
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(4)
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2)
  }
}))

export { AsideArea, BodyArea, BodySplit, ContentArea, LayoutRoot, ProfileCard, TabsArea }
