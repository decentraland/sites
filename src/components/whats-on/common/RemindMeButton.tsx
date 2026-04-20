import { RemindMeIcon } from './RemindMeIcon'
import { ActionTextButton, ActionTextLabel, RemindActiveButton } from './CardActions.styled'

type RemindMeButtonProps = {
  isReminded: boolean
  isLoading: boolean
  isShaking: boolean
  label: string
  onClick: (e: React.MouseEvent) => void
}

function RemindMeButton({ isReminded, isLoading, isShaking, label, onClick }: RemindMeButtonProps) {
  if (isReminded) {
    return (
      <RemindActiveButton onClick={onClick} disabled={isLoading}>
        <RemindMeIcon active shaking={isShaking} />
        <ActionTextLabel>{label}</ActionTextLabel>
      </RemindActiveButton>
    )
  }

  return (
    <ActionTextButton onClick={onClick} disabled={isLoading}>
      <RemindMeIcon active={false} shaking={isShaking} />
      <ActionTextLabel>{label}</ActionTextLabel>
    </ActionTextButton>
  )
}

export { RemindMeButton }
