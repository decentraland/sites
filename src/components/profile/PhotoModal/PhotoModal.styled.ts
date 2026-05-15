import { Box, Dialog, IconButton, Typography, styled } from 'decentraland-ui2'

const PhotoDialog = styled(Dialog)(({ theme }) => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.85)'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(2),
    maxWidth: 1500,
    width: '100%',
    maxHeight: '92vh',
    margin: 0,
    background: '#0E0518',
    boxShadow: '0px 4px 25px 0px rgba(255, 255, 255, 0.25)',
    overflow: 'hidden'
  },
  [theme.breakpoints.down('md')]: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '& .MuiDialog-paper': {
      borderRadius: 0,
      maxWidth: '100%',
      maxHeight: '100%',
      height: '100%',
      margin: 0
    }
  }
})) as typeof Dialog

const DialogBody = styled(Box, { shouldForwardProp: prop => prop !== '$metadataVisible' })<{ $metadataVisible: boolean }>(
  ({ theme, $metadataVisible }) => ({
    display: 'grid',
    // Right rail matches the original reels page (`MetadataContainer: 571px`) so the
    // ported `UserMetadata` row (fixed `calc(561px - 48px)`) doesn't overflow.
    gridTemplateColumns: $metadataVisible ? '1fr 571px' : '1fr',
    height: 'min(820px, 92vh)',
    transition: 'grid-template-columns 0.35s',
    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: '1fr',
      gridTemplateRows: $metadataVisible ? '1fr auto' : '1fr',
      height: '100%'
    }
  })
)

const ImagePanel = styled(Box)({
  position: 'relative',
  width: '100%',
  height: '100%',
  background: '#000',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden'
})

const Photo = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  display: 'block'
})

const MetadataPanel = styled(Box)(({ theme }) => ({
  // Match the profile page chrome — same radial gradient as `ProfileLayout.LayoutRoot`.
  background: 'radial-gradient(123.58% 82% at 9.01% 25.79%, #7434B1 0%, #481C6C 37.11%, #2B1040 100%)',
  color: '#fcfcfc',
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  overflowY: 'auto',
  overflowX: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}))

const MetadataHeader = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  paddingLeft: 24,
  paddingRight: 24
})

const SectionTitle = styled(Typography)({
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'rgba(255, 255, 255, 0.55)'
})

// `SectionTitle` rendered outside `MetadataHeader` (which is already padded) — pads itself
// to keep alignment with the rest of the panel content.
const SectionTitleRow = styled(SectionTitle)({
  paddingLeft: 24,
  paddingRight: 24
})

const DateLine = styled(Typography)({
  fontSize: 14,
  fontWeight: 500,
  color: '#fcfcfc'
})

const PhotoTakenByLine = styled(Box)({
  color: '#fcfcfc',
  fontSize: 14,
  marginTop: 4
})

const PhotoTakenByLink = styled('a')({
  color: '#57C2FF',
  textDecoration: 'none',
  marginLeft: 4,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    textDecoration: 'underline'
  }
})

const LocationRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  paddingLeft: 24,
  paddingRight: 24
})

const LocationLink = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  color: '#fcfcfc',
  fontSize: 14
})

const PeopleSection = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  // Nested UserMetadata rows own their own `marginLeft: 24` so this section spans the full panel.
  width: '100%'
})

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1.5),
  left: theme.spacing(1.5),
  zIndex: 10,
  color: '#fff',
  background: 'rgba(0, 0, 0, 0.45)',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    background: 'rgba(0, 0, 0, 0.65)'
  }
}))

export {
  CloseButton,
  DateLine,
  DialogBody,
  ImagePanel,
  LocationLink,
  LocationRow,
  MetadataHeader,
  MetadataPanel,
  PeopleSection,
  Photo,
  PhotoDialog,
  PhotoTakenByLine,
  PhotoTakenByLink,
  SectionTitle,
  SectionTitleRow
}
