import { Box, Typography, dclColors, styled } from 'decentraland-ui2'
import { safeCssUrl } from '../../../utils/safeCssUrl'
import { MEDIA_FALLBACK, SCENE_PANEL_GRADIENT } from '../_shared/DiscoverShell.styled'

// JUMP IN modal — pixel-matched to the Figma (2006:53288, 880×733): shown in
// place of the bevy watcher (desktop-empty scenes + all mobile scenes), over a
// rgba(0,0,0,0.8) backdrop. 449px hero with a black fade, title + creator +
// coords + JUMP IN / copy-link CTAs. Desktop overlays them on the image; mobile
// stacks them below it (Figma 2014-20434) with the LIVE + presence badges.
const SNOW = dclColors.neutral.softWhite // #fcfcfc
const GRAY3 = dclColors.neutral.gray3 // #a09ba8
const RUBY = dclColors.base.primary // #ff2d55
const HERO_FADE = 'linear-gradient(0deg, #000000 0%, rgba(0, 0, 0, 0.8) 30%, rgba(0, 0, 0, 0) 106%)'

const Backdrop = styled(Box)(({ theme }) => ({
  position: 'fixed',
  inset: 0,
  zIndex: 1300,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  overflowY: 'auto',
  // Mobile: the scene detail is a full PAGE (Figma 2014-47995), not an overlay.
  // Drop the dark backdrop + centering and let the card flow in the page below
  // the nav — cards navigate here on mobile instead of opening an in-place modal.
  [theme.breakpoints.down('sm')]: {
    position: 'static',
    padding: 0,
    backgroundColor: 'transparent',
    display: 'block',
    overflowY: 'visible'
  }
}))

const Modal = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: 'min(clamp(680px, 45.833vw, 880px), 100%)', // 880px at 1920
  maxHeight: '90vh',
  overflowY: 'auto',
  borderRadius: 24,
  boxShadow: '0px 4px 25px 0px rgba(255, 255, 255, 0.25)',
  background: SCENE_PANEL_GRADIENT,
  // Mobile: fill the page — no floating card, radius, shadow, or height cap.
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    maxWidth: 'none',
    maxHeight: 'none',
    minHeight: '60vh',
    overflowY: 'visible',
    borderRadius: 0,
    boxShadow: 'none'
  }
}))

// 880 : 449 hero with the cover image and a bottom black fade so the text
// block stays readable over any scene screenshot.
const Hero = styled(Box, { shouldForwardProp: prop => prop !== '$image' })<{ $image?: string }>(({ theme, $image }) => ({
  position: 'relative',
  width: '100%',
  aspectRatio: '880 / 449',
  borderRadius: '24px 24px 0 0',
  overflow: 'hidden',
  backgroundColor: MEDIA_FALLBACK,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  ...($image && { backgroundImage: `url("${safeCssUrl($image)}")` }),
  [theme.breakpoints.down('sm')]: { borderRadius: 0 } // flush on the full-page mobile layout
}))

// Bottom black fade so the overlaid text stays readable over any screenshot —
// desktop only. On mobile the text sits below the image, so no fade is needed.
const HeroFade = styled(Box)(({ theme }) => ({
  position: 'absolute',
  inset: 0,
  background: HERO_FADE,
  display: 'none',
  [theme.breakpoints.up('md')]: { display: 'block' }
}))

// Wraps the hero image + text block so the text can overlay the image on
// desktop (absolute) yet stack beneath it on mobile (Figma 2014-20434).
const HeroWrap = styled(Box)({
  position: 'relative'
})

// LIVE + presence badges pinned to the hero's top-left, shown when the scene
// has players (Figma 2014-20434, the mobile JUMP IN modal). Colors match the
// place cards' badges.
const HeroBadges = styled(Box)({
  position: 'absolute',
  top: 'clamp(12px, 1.25vw, 24px)',
  left: 'clamp(32px, 2.604vw, 50px)', // aligns with HeroText
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 12
})

// Title / creator / CTA block. Mobile: stacked below the hero image with its
// own padding. Desktop: pinned over the hero's bottom-left (50px / 30px).
const HeroText = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 'clamp(16px, 4.5vw, 20px)',
  [theme.breakpoints.up('md')]: {
    position: 'absolute',
    left: 'clamp(32px, 2.604vw, 50px)', // 50px
    bottom: 'clamp(20px, 1.563vw, 30px)', // 30px
    padding: 0
  }
}))

const Title = styled(Typography)({
  fontSize: 'clamp(22px, 1.667vw, 32px)', // 32px
  fontWeight: 600,
  lineHeight: 1.235,
  color: SNOW
})

const MetaRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 16
})

const CreatorRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0
})

// ADR-292: deterministic per-name color behind the (possibly transparent)
// face256 snapshot.
const Avatar = styled('img', { shouldForwardProp: prop => prop !== '$bg' })<{ $bg?: string }>(({ $bg }) => ({
  width: 'clamp(22px, 1.458vw, 28px)', // 28px
  height: 'clamp(22px, 1.458vw, 28px)',
  borderRadius: '50%',
  objectFit: 'cover',
  flexShrink: 0,
  border: '2px solid rgba(255, 255, 255, 0.5)',
  backgroundColor: $bg
}))

const ByText = styled(Typography)({
  fontSize: 'clamp(13px, 0.833vw, 16px)', // 16px
  fontWeight: 400,
  lineHeight: 1.75,
  color: SNOW,
  whiteSpace: 'nowrap'
})

const CreatorName = styled('span')({
  color: RUBY,
  fontWeight: 500
})

const LocationTag = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 8px',
  borderRadius: 8,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  fontSize: 'clamp(12px, 0.729vw, 14px)', // 14px
  fontWeight: 400,
  lineHeight: 1.43,
  color: SNOW
})

const CtaRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  paddingTop: 20
})

const JumpInCta = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8.198,
  flex: '1 1 auto', // full-width on mobile, beside the copy button
  height: 'clamp(38px, 2.396vw, 46px)', // 46px
  padding: '0 clamp(14px, 1.068vw, 20.5px)',
  border: 'none',
  borderRadius: 12,
  backgroundColor: RUBY,
  color: SNOW,
  fontSize: 'clamp(13px, 0.833vw, 16px)', // 16px
  fontWeight: 700,
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: theme.transitions.create('background-color', { duration: theme.transitions.duration.short }),
  ['&:hover']: { backgroundColor: dclColors.base.primaryDark1 },
  ['&:focus-visible']: { outline: `2px solid ${SNOW}`, outlineOffset: 2 },
  [theme.breakpoints.up('md')]: { flex: '0 0 auto', width: 'clamp(200px, 12.969vw, 249px)' } // 249px
}))

// Square copy-link button next to JUMP IN — 46×46, 1px snow border, r12.
const CopyCta = styled('button')(({ theme }) => ({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'clamp(38px, 2.396vw, 46px)', // 46px
  height: 'clamp(38px, 2.396vw, 46px)',
  padding: 10,
  border: `1px solid ${SNOW}`,
  borderRadius: 12,
  backgroundColor: 'transparent',
  color: SNOW,
  cursor: 'pointer',
  transition: theme.transitions.create('background-color', { duration: theme.transitions.duration.short }),
  ['&:hover']: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  ['&:focus-visible']: { outline: `2px solid ${SNOW}`, outlineOffset: 2 }
}))

// Close (X) — 40×40 rounded-10 dark button, 20px inset top-right.
const CloseCta = styled('button')(({ theme }) => ({
  position: 'absolute',
  top: 'clamp(14px, 1.042vw, 20px)', // 20px
  right: 'clamp(14px, 1.042vw, 20px)',
  zIndex: 2,
  width: 'clamp(32px, 2.083vw, 40px)', // 40px
  height: 'clamp(32px, 2.083vw, 40px)',
  padding: 0,
  border: 'none',
  borderRadius: 10,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  cursor: 'pointer',
  transition: theme.transitions.create('background-color', { duration: theme.transitions.duration.short }),
  ['&:hover']: { backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  ['&:focus-visible']: { outline: `2px solid ${SNOW}`, outlineOffset: 2 }
}))

// About block below the hero — 50px side insets (880 − 780 content), 30px gaps.
const About = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 'clamp(20px, 1.563vw, 30px) clamp(32px, 2.604vw, 50px)' // 30px 50px
})

const AboutLabel = styled(Typography)({
  fontSize: 'clamp(13px, 0.833vw, 16px)', // 16px
  fontWeight: 600,
  lineHeight: 1.75,
  textTransform: 'uppercase',
  color: GRAY3
})

const AboutText = styled(Typography)({
  fontSize: 'clamp(13px, 0.833vw, 16px)', // 16px
  fontWeight: 400,
  lineHeight: 1.5,
  color: dclColors.neutral.white,
  whiteSpace: 'pre-wrap'
})

// Transient confirmation shown above the copy button after a successful
// clipboard write.
const CopiedBubble = styled('span')(({ theme }) => ({
  position: 'absolute',
  bottom: 'calc(100% + 8px)',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: theme.spacing(0.5, 1.25),
  borderRadius: 6,
  backgroundColor: dclColors.neutral.softBlack1,
  color: dclColors.neutral.softWhite,
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  pointerEvents: 'none'
}))

export {
  CopiedBubble,
  About,
  AboutLabel,
  AboutText,
  Avatar,
  Backdrop,
  ByText,
  CloseCta,
  CopyCta,
  CreatorName,
  CreatorRow,
  CtaRow,
  Hero,
  HeroBadges,
  HeroFade,
  HeroText,
  HeroWrap,
  JumpInCta,
  LocationTag,
  MetaRow,
  Modal,
  Title
}
