/* eslint-disable import/no-default-export */
declare module 'whats_on/App' {
  import type { ComponentType } from 'react'
  const component: ComponentType
  export default component
}

interface Window {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __REMOTE_URLS__?: Record<string, string>
}
