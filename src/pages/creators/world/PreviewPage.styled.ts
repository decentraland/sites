import { Box, Typography, dclColors, styled } from 'decentraland-ui2'
import { safeCssUrl } from '../../../components/blog/utils/safeCssUrl'

const PlayCircle = styled(Box)(() => ({
  width: 72,
  height: 72,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(252, 252, 252, 0.92)',
  transition: 'transform 0.2s ease, background-color 0.2s ease',
  ['& svg']: { fontSize: 40, color: dclColors.neutral.softBlack1, marginLeft: 3 }
}))

interface PosterProps {
  $cover?: string
}

// Pre-launch poster. The bevy iframe only mounts after the user clicks Launch,
// so entering the Preview tab never loads the heavy client. Hover targets
// `PlayCircle` via Emotion component interpolation (not a magic className).
const Poster = styled('button', { shouldForwardProp: prop => prop !== '$cover' })<PosterProps>(({ theme, $cover }) => ({
  appearance: 'none',
  cursor: 'pointer',
  width: '100%',
  aspectRatio: '16 / 9',
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  overflow: 'hidden',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1.5),
  color: dclColors.neutral.softWhite,
  backgroundColor: dclColors.neutral.softBlack1,
  backgroundImage: $cover
    ? `linear-gradient(180deg, rgba(13,4,24,0.55) 0%, rgba(13,4,24,0.75) 100%), url("${safeCssUrl($cover)}")`
    : 'linear-gradient(135deg, #7434B1 0%, #2B1040 100%)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  transition: 'border-color 0.2s ease',
  ['&:hover']: { borderColor: dclColors.whiteTransparent.blurry },
  [`&:hover ${PlayCircle}`]: { transform: 'scale(1.06)', backgroundColor: dclColors.neutral.softWhite },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: 2 }
}))

const PosterTitle = styled(Typography)({ fontSize: 16, fontWeight: 700, letterSpacing: '0.02em' })
const PosterHint = styled(Typography)({ fontSize: 13, color: dclColors.neutral.gray3, maxWidth: 360, textAlign: 'center' })

// ---- Launched bevy embed ----
const VideoArea = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  aspectRatio: '16 / 9',
  borderRadius: theme.spacing(1.5),
  overflow: 'hidden',
  backgroundColor: dclColors.neutral.softBlack1,
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  ['&:fullscreen']: { borderRadius: 0, border: 'none' }
}))

const SceneIframe = styled('iframe')({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  border: 'none',
  display: 'block'
})

// Single, minimal control overlaid on the bevy frame — fullscreen only.
const FullscreenButton = styled('button')(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(1.5),
  right: theme.spacing(1.5),
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  height: 38,
  paddingInline: theme.spacing(1.75),
  borderRadius: theme.spacing(1.25),
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: dclColors.neutral.softWhite,
  backgroundColor: dclColors.blackTransparent.blurry,
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  backdropFilter: 'blur(8px)',
  transition: 'background-color 0.15s ease, border-color 0.15s ease',
  ['& svg']: { fontSize: 18 },
  ['&:hover']: { backgroundColor: 'rgba(0, 0, 0, 0.6)', borderColor: dclColors.neutral.softWhite },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: 2 }
}))

export { FullscreenButton, PlayCircle, Poster, PosterHint, PosterTitle, SceneIframe, VideoArea }
