import { Box, CardActionArea, Checkbox, styled } from 'decentraland-ui2'

const SelectableCardRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: '100%',
  paddingLeft: theme.spacing(1)
}))

const SelectCheckbox = styled(Checkbox)({
  alignSelf: 'center'
})

const CardArea = styled(CardActionArea)({
  flex: 1,
  minWidth: 0
})

export { CardArea, SelectableCardRow, SelectCheckbox }
