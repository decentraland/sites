declare module 'virtual:__federation__' {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  function __federation_method_setRemote(name: string, config: { url: string; format: string; from: string }): void
  // eslint-disable-next-line @typescript-eslint/naming-convention
  function __federation_method_getRemote(name: string, component: string): Promise<() => unknown>
}

interface Window {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __REMOTE_URLS__?: Record<string, string>
}
