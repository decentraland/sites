import type { WorldScene } from '../../../features/cast2/cast2.types'

interface WorldSceneSelectorProps {
  scenes: WorldScene[]
  worldName: string
  onSelect: (parcel: string) => void
}

export type { WorldSceneSelectorProps }
