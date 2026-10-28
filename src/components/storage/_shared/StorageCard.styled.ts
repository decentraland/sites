// eslint-disable-next-line @typescript-eslint/naming-convention
import FmdGoodIcon from '@mui/icons-material/FmdGood'
import { Box, CardActions, styled } from 'decentraland-ui2'

const CardLabel = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  marginBottom: 4
})

const CardFooter = styled(CardActions)(({ theme }) => ({
  justifyContent: 'space-between',
  paddingInline: theme.spacing(2),
  paddingBottom: theme.spacing(1.5)
}))

const LocationIcon = styled(FmdGoodIcon)(({ theme }) => ({
  fontSize: 16,
  color: theme.palette.text.secondary
}))

export { CardFooter, CardLabel, LocationIcon }
