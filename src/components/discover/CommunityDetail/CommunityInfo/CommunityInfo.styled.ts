import { hexToRgba } from 'decentraland-ui2/dist/utils/colors'
import { Avatar, Box, Button, Typography, dclColors, styled } from 'decentraland-ui2'

const InfoSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(7.5),
  alignItems: 'start',
  paddingTop: theme.spacing(6),
  paddingBottom: theme.spacing(4),
  paddingLeft: theme.spacing(30),
  paddingRight: theme.spacing(30),
  backgroundColor: hexToRgba(dclColors.neutral.black, 0.3),
  [theme.breakpoints.between('lg', 'xl')]: {
    paddingLeft: theme.spacing(10),
    paddingRight: theme.spacing(10)
  },
  [theme.breakpoints.between('md', 'lg')]: {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3)
  },
  [theme.breakpoints.down('md')]: {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3)
  },
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(3)
  },
  [theme.breakpoints.down('xs')]: {
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    gap: theme.spacing(4)
  }
}))

const TopRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  width: '100%',
  gap: theme.spacing(7.5),
  alignItems: 'start',
  [theme.breakpoints.between('lg', 'xl')]: { gap: theme.spacing(5) },
  [theme.breakpoints.down('sm')]: { gap: theme.spacing(3) },
  [theme.breakpoints.down('xs')]: { flexDirection: 'column' }
}))

const DescriptionRow = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5)
}))

const CommunityImage = styled(Box)(({ theme }) => ({
  width: '320px',
  height: '320px',
  borderRadius: '23.712px',
  overflow: 'hidden',
  flexShrink: 0,
  backgroundColor: theme.palette.background.default,
  [theme.breakpoints.down('sm')]: { width: '210px', height: '210px' },
  [theme.breakpoints.down(391)]: { width: '100%', height: '300px', borderRadius: '0' }
}))

const CommunityImageContent = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover'
})

// Visible when the thumbnail URL is missing or 404s. Mirrors the
// CommunityCard fallback shape so missing-image cards stay on-brand
// instead of showing the browser's broken-image glyph.
const CommunityImageFallback = styled('div')(({ theme }) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 96,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: theme.palette.common.white,
  background: 'linear-gradient(135deg, #4a2475 0%, #1a0b2e 100%)'
}))

const CommunityDetails = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  gap: theme.spacing(3),
  minWidth: 0,
  [theme.breakpoints.down('sm')]: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2)
  }
}))

const PrivacyBadgeContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '5.272px',
  height: '22.992px'
})

const PrivacyIconContainer = styled(Box)({
  width: '13.18px',
  height: '13.18px',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
})

const PrivacyBadgeText = styled(Typography)(({ theme }) => ({
  fontSize: '15.82px',
  fontWeight: 400,
  lineHeight: 1,
  color: dclColors.neutral.gray3,
  fontFamily: theme.typography.fontFamily,
  textTransform: 'capitalize'
}))

const OwnerRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.25)
}))

const OwnerAvatarContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  backgroundColor: theme.palette.success.main,
  border: `2.286px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  overflow: 'hidden'
}))

const OwnerAvatar = styled(Avatar, {
  shouldForwardProp: prop => prop !== 'backgroundColor'
})<{ backgroundColor?: string }>(({ backgroundColor, theme }) => ({
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  backgroundColor: backgroundColor ?? theme.palette.secondary.main
}))

const OwnerText = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  fontSize: theme.typography.body1.fontSize,
  fontWeight: 400,
  lineHeight: 1.5,
  color: dclColors.neutral.softWhite,
  fontFamily: theme.typography.fontFamily
}))

const OwnerName = styled('span')(({ theme }) => ({
  color: theme.palette.primary.main,
  marginLeft: theme.spacing(0.5)
}))

const ActionButtons = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  paddingTop: theme.spacing(1.5),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column'
  }
}))

// White pill CTA matching the scene-detail `PrimaryButton`. MUI's primary
// "contained" variant lands in brand red and was overpowering inside the
// already-purple community hero. Outlined variants (used for "Joined" /
// "Confirm leave") fall through to MUI defaults and keep the secondary
// neutral border treatment.
const CTAButton = styled(Button, {
  shouldForwardProp: prop => prop !== 'isPrimary'
})<{ isPrimary?: boolean }>(({ isPrimary, theme }) => ({
  width: '184px',
  height: '40px',
  [theme.breakpoints.down('xs')]: { width: '100%' },
  [theme.breakpoints.down('sm')]: { width: '100%' },
  // Primary CTA is rendered without `variant="contained"` so MUI's
  // `containedPrimary` class never paints brand red. We're left with the
  // bare `MuiButton-root` baseline, which the emotion overrides below
  // recolor into a white pill that matches the scene-detail PrimaryButton.
  ...(isPrimary && {
    backgroundColor: dclColors.neutral.softWhite,
    color: dclColors.neutral.softBlack1,
    borderRadius: theme.spacing(1.5),
    fontSize: 14,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    boxShadow: 'none',
    ['&:hover']: { backgroundColor: 'rgba(252, 252, 252, 0.85)', boxShadow: 'none' },
    ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: 2 },
    ['&.Mui-disabled']: { backgroundColor: 'rgba(252, 252, 252, 0.4)', color: dclColors.neutral.softBlack1 }
  })
}))

// Lightweight section label matching the scene-detail `SectionLabel` — used
// above the community description so it reads as a distinct block instead
// of a floating paragraph.
const SectionLabel = styled(Typography)(({ theme }) => ({
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.75,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: dclColors.neutral.gray3,
  marginBottom: theme.spacing(0.5)
}))

const TitleContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5)
}))

const TitleHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.25)
}))

const CommunityLabel = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: 400,
  fontSize: theme.typography.caption.fontSize,
  lineHeight: '100%',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: dclColors.neutral.gray3
}))

const Title = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: 500,
  fontSize: theme.typography.h4.fontSize,
  lineHeight: '124%',
  color: dclColors.neutral.softWhite
}))

const PrivacyMembersRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  flexWrap: 'wrap'
}))

const PrivacyDivider = styled(Box)(({ theme }) => ({
  width: '1px',
  height: '13.18px',
  backgroundColor: theme.palette.divider,
  flexShrink: 0
}))

const PrivacyMembersText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.body1.fontSize,
  fontWeight: 400,
  lineHeight: 1.75,
  color: dclColors.neutral.softWhite,
  fontFamily: theme.typography.fontFamily
}))

const Description = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.body1.fontSize,
  fontWeight: 400,
  lineHeight: '175%',
  color: theme.palette.text.primary,
  whiteSpace: 'pre-wrap'
}))

export {
  ActionButtons,
  CTAButton,
  CommunityDetails,
  CommunityImage,
  CommunityImageContent,
  CommunityImageFallback,
  CommunityLabel,
  Description,
  DescriptionRow,
  InfoSection,
  OwnerAvatar,
  OwnerAvatarContainer,
  OwnerName,
  OwnerRow,
  OwnerText,
  PrivacyBadgeContainer,
  PrivacyBadgeText,
  PrivacyDivider,
  PrivacyIconContainer,
  PrivacyMembersRow,
  PrivacyMembersText,
  SectionLabel,
  Title,
  TitleContainer,
  TitleHeader,
  TopRow
}
