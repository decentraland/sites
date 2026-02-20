import type { HTMLProps } from 'react'

type VideoProps = HTMLProps<HTMLVideoElement> & {
  play?: boolean
  playsInline?: boolean
  source?: string
}

export type { VideoProps }
