import { ToggleContainer, ToggleLabel, ToggleThumb, ToggleTrack } from './ToggleSwitch.styled'

type ToggleSwitchProps = {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ToggleSwitch({ label, checked, onChange }: ToggleSwitchProps) {
  return (
    <ToggleContainer>
      <ToggleLabel>{label}</ToggleLabel>
      <ToggleTrack $checked={checked} onClick={() => onChange(!checked)} role="switch" aria-checked={checked} aria-label={label}>
        <ToggleThumb $checked={checked} />
      </ToggleTrack>
    </ToggleContainer>
  )
}

export { ToggleSwitch }
export type { ToggleSwitchProps }
