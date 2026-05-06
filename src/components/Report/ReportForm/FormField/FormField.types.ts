import type { ReactNode } from 'react'

interface FormFieldBaseProps {
  number: number
  label: ReactNode
  helper: ReactNode
  error?: string
  children: ReactNode
}

type FormFieldProps = FormFieldBaseProps & ({ optional: true; required?: never } | { optional?: false; required?: boolean })

export type { FormFieldProps }
