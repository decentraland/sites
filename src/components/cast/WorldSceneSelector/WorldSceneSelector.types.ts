import type { WorldScene } from '../../../features/media/cast/cast2.types'

interface WorldSceneSelectorProps {
  scenes: WorldScene[]
  worldName: string
  onSelect: (parcel: string) => void
}

export type { WorldSceneSelectorProps }
