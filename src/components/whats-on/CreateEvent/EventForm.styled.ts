import {
  Alert,
  Box,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  styled
} from 'decentraland-ui2'

/* ── shared input theme ─────────────────────────────────────────────── */

const inputBorder = '#a09ba8'
const inputText = '#fcfcfc'
const labelColor = '#a09ba8'

/* eslint-disable @typescript-eslint/naming-convention */
const outlinedInputOverrides = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 6,
    '& fieldset': {
      borderColor: inputBorder
    },
    '&:hover fieldset': {
      borderColor: inputText
    },
    '&.Mui-focused fieldset': {
      borderWidth: 1,
      borderColor: inputText
    }
  },
  '& .MuiInputLabel-root': {
    color: labelColor,
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.15px',
    '&.Mui-focused': {
      color: labelColor
    }
  },
  '& .MuiOutlinedInput-notchedOutline legend': {
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.15px'
  },
  '& .MuiOutlinedInput-input': {
    color: inputText,
    fontSize: 16,
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    '&::placeholder': {
      color: labelColor,
      opacity: 1,
      fontWeight: 600
    },
    '&::-webkit-calendar-picker-indicator': {
      position: 'absolute',
      right: 0,
      top: 0,
      width: '100%',
      height: '100%',
      opacity: 0,
      cursor: 'pointer'
    },
    '&::-webkit-inner-spin-button': {
      display: 'none'
    }
  }
} as const
/* eslint-enable @typescript-eslint/naming-convention */

/* ── MUI wrappers ───────────────────────────────────────────────────── */

const EventTextField = styled(TextField)({
  ...outlinedInputOverrides
})

const EventTextArea = styled(TextField)({
  ...outlinedInputOverrides,
  /* eslint-disable @typescript-eslint/naming-convention */
  '& .MuiOutlinedInput-root': {
    ...outlinedInputOverrides['& .MuiOutlinedInput-root'],
    alignItems: 'flex-start'
  }
  /* eslint-enable @typescript-eslint/naming-convention */
})

const EventFormControl = styled(FormControl)({
  ...outlinedInputOverrides,
  /* eslint-disable @typescript-eslint/naming-convention */
  '& .MuiSelect-select': {
    color: inputText,
    fontSize: 16,
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif"
  },
  '& .MuiSelect-icon': {
    color: inputText
  }
  /* eslint-enable @typescript-eslint/naming-convention */
})

const EventInputLabel = styled(InputLabel)({
  color: labelColor,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.15px',
  /* eslint-disable @typescript-eslint/naming-convention */
  '&.Mui-focused': {
    color: labelColor
  }
  /* eslint-enable @typescript-eslint/naming-convention */
})

const EventSelect = styled(Select)({
  borderRadius: 6,
  /* eslint-disable @typescript-eslint/naming-convention */
  '& fieldset': {
    borderColor: inputBorder
  },
  '&:hover fieldset': {
    borderColor: inputText
  },
  '&.Mui-focused fieldset': {
    borderWidth: 1,
    borderColor: inputText
  }
  /* eslint-enable @typescript-eslint/naming-convention */
})

const EventMenuItem = styled(MenuItem)({
  fontFamily: "'Inter', sans-serif",
  fontSize: 16,
  fontWeight: 600
})

const EventSwitch = styled(Switch)(({ theme }) => ({
  /* eslint-disable @typescript-eslint/naming-convention */
  '& .MuiSwitch-switchBase': {
    '&.Mui-checked': {
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: theme.palette.primary.main,
        opacity: 0.5
      }
    }
  },
  '& .MuiSwitch-track': {
    backgroundColor: '#cfcdd4',
    opacity: 0.38
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

/* ── layout ─────────────────────────────────────────────────────────── */

const ContentContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  borderRadius: 40,
  paddingBottom: theme.spacing(4),
  [theme.breakpoints.down('md')]: {
    gap: theme.spacing(1.5),
    borderRadius: 0,
    paddingBottom: 0
  }
}))

const FormColumns = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(6),
  width: '100%',
  minWidth: 0,
  [theme.breakpoints.down('lg')]: {
    flexDirection: 'column',
    gap: theme.spacing(4)
  },
  [theme.breakpoints.down('md')]: {
    gap: 0
  }
}))

const LeftCard = styled(Box)(({ theme }) => ({
  background: 'rgba(0, 0, 0, 0.2)',
  borderRadius: theme.spacing(3),
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  flex: 1,
  minWidth: 0,
  [theme.breakpoints.down('md')]: {
    borderRadius: 0,
    padding: theme.spacing(3, 2)
  }
}))

const RightSection = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: theme.spacing(3),
  paddingTop: theme.spacing(3),
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(3, 2)
  }
}))

const RightSectionFields = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(6),
  [theme.breakpoints.down('md')]: {
    gap: theme.spacing(4)
  }
}))

const RightSectionFooter = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  width: '100%'
}))

/* ── left card sections ─────────────────────────────────────────────── */

const ImageSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}))

const DescriptionFields = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3)
}))

/* ── right column sections ──────────────────────────────────────────── */

const SectionHeading = styled(Typography)(({ theme }) => ({
  fontSize: 24,
  fontWeight: 500,
  lineHeight: 1.334,
  color: inputText,
  [theme.breakpoints.down('md')]: {
    fontSize: 20,
    lineHeight: 1.6
  }
}))

const EventDetailsBlock = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4)
}))

const DateTimeSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}))

const DateTimeRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
  flex: 1,
  minWidth: 0,
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column'
  }
}))

const RepeatRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5)
}))

const RepeatLabel = styled(Typography)({
  fontSize: 16,
  fontWeight: 400,
  color: inputText,
  lineHeight: 1.75
})

const RepeatFields = styled(Box, {
  shouldForwardProp: prop => prop !== '$visible'
})<{ $visible: boolean }>(({ $visible, theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  maxHeight: $visible ? 320 : 0,
  opacity: $visible ? 1 : 0,
  overflow: 'hidden',
  paddingTop: $visible ? 10 : 0,
  transition: 'max-height 0.3s ease, opacity 0.3s ease, padding-top 0.3s ease'
}))

const IntervalChipGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.75)
}))

const ChipErrorText = styled(Typography)(({ theme }) => ({
  fontSize: 12,
  fontWeight: 400,
  color: theme.palette.error.main,
  lineHeight: 1.5,
  letterSpacing: '0.15px'
}))

const IntervalChipLabel = styled(Typography)({
  fontSize: 12,
  fontWeight: 400,
  color: labelColor,
  letterSpacing: '0.15px',
  lineHeight: 1.5
})

const IntervalChipRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1)
}))

/* eslint-disable @typescript-eslint/naming-convention -- pseudo-class selectors */
const IntervalChip = styled('button', {
  shouldForwardProp: prop => prop !== '$active'
})<{ $active: boolean }>(({ $active, theme }) => ({
  minWidth: 44,
  height: 28,
  padding: `0 ${theme.spacing(1)}`,
  borderRadius: 14,
  border: `1px solid ${$active ? theme.palette.primary.main : inputBorder}`,
  background: $active ? theme.palette.primary.main : 'transparent',
  color: $active ? '#fff' : inputText,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    background: $active ? theme.palette.primary.dark : 'rgba(255, 255, 255, 0.04)'
  },
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2
  }
}))
/* eslint-enable @typescript-eslint/naming-convention */

/* ── location section ───────────────────────────────────────────────── */

const LocationBlock = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3)
}))

const LocationLabel = styled(Typography)(({ theme }) => ({
  fontSize: 16,
  fontWeight: 400,
  color: inputText,
  lineHeight: 1.75,
  [theme.breakpoints.down('md')]: {
    display: 'none'
  }
}))

const LocationRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(4),
  alignItems: 'flex-start',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    gap: theme.spacing(3)
  }
}))

const CoordinatesRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
  flex: 1
}))

const CoordPrefix = styled(InputAdornment)({
  /* eslint-disable @typescript-eslint/naming-convention */
  '& .MuiTypography-root': {
    color: labelColor,
    fontSize: 16,
    fontWeight: 400,
    fontFamily: "'Inter', sans-serif"
  }
  /* eslint-enable @typescript-eslint/naming-convention */
})

/* ── email section ──────────────────────────────────────────────────── */

const EmailSection = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(1.5),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  width: '48%',
  [theme.breakpoints.down('md')]: {
    width: '100%'
  }
}))

const ReviewText = styled(Typography)({
  fontSize: 12,
  fontWeight: 400,
  color: '#a09ba8',
  lineHeight: 1,
  fontFamily: "'Inter', sans-serif"
})

const ErrorMessage = styled(ReviewText)(({ theme }) => ({
  color: theme.palette.error.main
}))

const SubmitErrorMessage = styled(ErrorMessage)({
  textAlign: 'center'
})

/* ── review notice + preview button row ─────────────────────────────── */

const ReviewBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  width: '100%',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: theme.spacing(1.5)
  }
}))

const ReviewNotice = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  color: '#a09ba8',
  flex: 1,
  minWidth: 0
}))

const PreviewButton = styled('button', {
  shouldForwardProp: prop => prop !== '$enabled'
})<{ $enabled: boolean }>(({ $enabled, theme }) => ({
  background: 'rgba(236, 235, 237, 0.2)',
  border: 'none',
  borderRadius: 12,
  color: '#fcfcfc',
  fontFamily: "'Inter', sans-serif",
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: '0.4px',
  textTransform: 'uppercase',
  height: 36,
  padding: '6px 16px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  cursor: 'pointer',
  opacity: $enabled ? 1 : 0.5,
  transition: theme.transitions.create(['background-color', 'opacity'], {
    duration: theme.transitions.duration.standard
  }),
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    background: $enabled ? 'rgba(236, 235, 237, 0.3)' : 'rgba(236, 235, 237, 0.2)'
  },
  '&:focus-visible': {
    outline: '2px solid #ecebed',
    outlineOffset: 2
  },
  [theme.breakpoints.down('md')]: {
    alignSelf: 'flex-end'
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

/* ── CTA bar ────────────────────────────────────────────────────────── */

const FormActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: theme.spacing(1.25),
  paddingTop: theme.spacing(4),
  borderTop: '2px solid rgba(255, 255, 255, 0.2)',
  /* eslint-disable @typescript-eslint/naming-convention */
  [theme.breakpoints.down('md')]: {
    '& > *': {
      flex: 1
    }
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const CancelButton = styled('button')(({ theme }) => ({
  background: 'transparent',
  border: '1.555px solid #ecebed',
  borderRadius: 12,
  color: '#ecebed',
  fontFamily: "'Inter', sans-serif",
  fontSize: 14,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.48px',
  padding: '8px 22px',
  width: 200,
  height: 48,
  cursor: 'pointer',
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.standard
  }),
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.08)'
  },
  '&:focus-visible': {
    outline: '2px solid #ecebed',
    outlineOffset: 2
  },
  [theme.breakpoints.down('md')]: {
    width: 'auto'
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const SubmitButton = styled('button')(({ theme }) => ({
  background: theme.palette.primary.main,
  border: 'none',
  borderRadius: 12,
  color: '#ffffff',
  fontFamily: "'Inter', sans-serif",
  fontSize: 14,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.48px',
  padding: '8px 22px',
  width: 200,
  height: 48,
  cursor: 'pointer',
  transition: theme.transitions.create(['background-color', 'box-shadow', 'opacity'], {
    duration: theme.transitions.duration.standard
  }),
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    background: theme.palette.primary.dark,
    boxShadow: '0 3px 1px -2px rgba(0,0,0,0.2), 0 2px 2px rgba(0,0,0,0.14), 0 1px 5px rgba(0,0,0,0.12)'
  },
  '&:disabled': {
    background: '#f8919d',
    color: '#fee9ec',
    opacity: 0.6,
    cursor: 'not-allowed',
    pointerEvents: 'none'
  },
  '&:focus-visible': {
    outline: '2px solid #ecebed',
    outlineOffset: 2
  },
  [theme.breakpoints.down('md')]: {
    width: 'auto'
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

/* ── vertical cover button ──────────────────────────────────────────── */

const AddVerticalCoverButton = styled('button')({
  background: 'rgba(255, 255, 255, 0.1)',
  border: 'none',
  borderRadius: 8,
  padding: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  cursor: 'pointer',
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.15)'
  }
  /* eslint-enable @typescript-eslint/naming-convention */
})

const AddCoverText = styled('span')({
  fontSize: 14,
  color: inputText,
  fontFamily: "'Inter', sans-serif"
})

const AddCoverBold = styled('span')({
  fontWeight: 600
})

const AddCoverLight = styled('span')({
  fontWeight: 400
})

// Figma tokens system/error/red-light-2 (#ffcdd4) and red-dark-1 (#ec303a) — not exposed by decentraland-ui2 theme yet.
const rejectionAlertBg = '#ffcdd4'
const rejectionAlertText = '#ec303a'

const RejectionAlert = styled(Alert)({
  width: '100%',
  backgroundColor: rejectionAlertBg,
  color: rejectionAlertText,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiAlert-icon': { color: rejectionAlertText }
})

export {
  AddCoverBold,
  AddCoverLight,
  AddCoverText,
  AddVerticalCoverButton,
  CancelButton,
  ContentContainer,
  CoordPrefix,
  CoordinatesRow,
  DateTimeRow,
  DateTimeSection,
  DescriptionFields,
  EmailSection,
  ErrorMessage,
  EventDetailsBlock,
  EventFormControl,
  EventInputLabel,
  EventMenuItem,
  EventSelect,
  EventSwitch,
  EventTextArea,
  EventTextField,
  inputText,
  labelColor,
  FormActions,
  FormColumns,
  ImageSection,
  LeftCard,
  LocationBlock,
  LocationLabel,
  LocationRow,
  PreviewButton,
  RejectionAlert,
  ChipErrorText,
  IntervalChip,
  IntervalChipGroup,
  IntervalChipLabel,
  IntervalChipRow,
  RepeatFields,
  RepeatLabel,
  RepeatRow,
  ReviewBar,
  ReviewNotice,
  ReviewText,
  RightSection,
  RightSectionFields,
  RightSectionFooter,
  SectionHeading,
  SubmitButton,
  SubmitErrorMessage
}
