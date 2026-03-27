type IntercomWindow = Window & {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Intercom?: (...args: unknown[]) => void
  intercomSettings: IntercomSettings
}

type IntercomSettings = Partial<{
  alignment: 'left' | 'right'
  horizontalPadding: number
  verticalPadding: number
}>

type IntercomProps = {
  appId: string
  data?: Record<string, unknown>
  settings?: IntercomSettings
}

export type { IntercomProps, IntercomSettings, IntercomWindow }
