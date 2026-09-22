import { Dialog, DialogActions, Typography, dclColors, styled } from 'decentraland-ui2'

const DELETE_MODAL_BACKGROUND = '#2E1041'

// Doubled `&&` raises specificity so these rules deterministically beat the theme's
// paper/button styles regardless of Emotion style-injection order (which varies per route).
const StyledDialog = styled(Dialog)(({ theme }) => ({
  /* eslint-disable @typescript-eslint/naming-convention */
  '&& .MuiDialog-paper': {
    backgroundColor: DELETE_MODAL_BACKGROUND,
    // MUI dark mode tints elevated Paper with a translucent white overlay
    // (elevation24 ≈ 16%), washing out the background color. Disable it.
    backgroundImage: 'none',
    borderRadius: theme.spacing(3),
    color: dclColors.neutral.softWhite,
    maxWidth: 540,
    width: '100%',
    padding: theme.spacing(4),
    gap: theme.spacing(4)
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const Title = styled(Typography)({
  fontFamily: "'Inter', sans-serif",
  fontSize: 24,
  fontWeight: 500,
  lineHeight: 1.334,
  textAlign: 'center',
  color: dclColors.neutral.softWhite
})

const Subtitle = styled(Typography)({
  fontFamily: "'Inter', sans-serif",
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.5,
  textAlign: 'center',
  color: dclColors.neutral.softWhite
})

// Light cancel button per the design: soft-white surface with dark text,
// in contrast with the red destructive confirm.
// Native button instead of MUI Button: the theme styles `containedPrimary` with
// high-specificity selectors (`.MuiButton-sizeMedium.MuiButton-containedPrimary:not(...)`)
// that class-based overrides can't reliably beat. Same pattern as EventForm's buttons.
const CancelActionButton = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 48,
  border: 'none',
  borderRadius: 12,
  padding: '8px 22px',
  backgroundColor: dclColors.neutral.softWhite,
  color: dclColors.neutral.softBlack1,
  fontFamily: "'Inter', sans-serif",
  fontSize: 14,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.48px',
  cursor: 'pointer',
  transition: theme.transitions.create(['background-color'], {
    duration: theme.transitions.duration.standard
  }),
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    backgroundColor: dclColors.neutral.gray5
  },
  '&:focus-visible': {
    outline: `2px solid ${dclColors.neutral.softWhite}`,
    outlineOffset: 2
  },
  '&:disabled': {
    backgroundColor: dclColors.neutral.gray4,
    color: dclColors.neutral.gray1,
    cursor: 'default'
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

// Destructive confirm, same native-button shape as Cancel so both actions match.
const DeleteActionButton = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 48,
  border: 'none',
  borderRadius: 12,
  padding: '8px 22px',
  backgroundColor: theme.palette.primary.main,
  color: dclColors.neutral.softWhite,
  fontFamily: "'Inter', sans-serif",
  fontSize: 14,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.48px',
  cursor: 'pointer',
  transition: theme.transitions.create(['background-color'], {
    duration: theme.transitions.duration.standard
  }),
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    backgroundColor: theme.palette.primary.dark
  },
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2
  },
  '&:disabled': {
    backgroundColor: dclColors.neutral.gray4,
    color: dclColors.neutral.gray1,
    cursor: 'default'
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: 0,
  display: 'flex',
  gap: theme.spacing(3),
  /* eslint-disable @typescript-eslint/naming-convention */
  '& > *': { flex: 1 }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

export { CancelActionButton, DeleteActionButton, StyledDialog, StyledDialogActions, Subtitle, Title }
