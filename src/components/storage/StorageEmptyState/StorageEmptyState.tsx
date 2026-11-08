import type { FC } from 'react'
import { EmptyCard, EmptyLabel } from './StorageEmptyState.styled'

const StorageEmptyState: FC<{ label: string }> = ({ label }) => (
  <EmptyCard>
    <EmptyLabel>{label}</EmptyLabel>
  </EmptyCard>
)

export { StorageEmptyState }
