import { NumberBullet } from '../NumberBullet'
import type { FormFieldProps } from './FormField.types'
import { FieldError, FieldHelper, FieldLabel, FieldOptionalMark, FieldRequiredMark, FieldWrapper } from './FormField.styled'

function FormField({ number, label, optional, required, helper, error, children }: FormFieldProps) {
  return (
    <FieldWrapper>
      <FieldLabel>
        <NumberBullet number={number} />
        {label}
        {optional && <FieldOptionalMark>(Optional)</FieldOptionalMark>}
        {required && <FieldRequiredMark>*</FieldRequiredMark>}
      </FieldLabel>
      <FieldHelper>{helper}</FieldHelper>
      {children}
      {error && <FieldError>{error}</FieldError>}
    </FieldWrapper>
  )
}

export { FormField }
