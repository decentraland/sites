import { Paper, Typography, styled } from 'decentraland-ui2'

const EmptyCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center'
}))

const EmptyLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary
}))

export { EmptyCard, EmptyLabel }
