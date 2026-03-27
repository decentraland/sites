import type { IntercomSettings, IntercomWindow } from './Intercom.types'

function insertScript({ type = 'text/javascript', async: isAsync = true, ...props }: Record<string, unknown>) {
  const script = document.createElement('script')
  Object.assign(script, { type, async: isAsync, ...props })
  document.body.appendChild(script)
  return script
}

function isInjected() {
  const intercomWindow = typeof window !== 'undefined' ? (window as unknown as IntercomWindow) : null
  return intercomWindow && typeof intercomWindow.Intercom === 'function'
}

function getWindowClient(appId: string) {
  return (...args: unknown[]) => {
    if (!appId) {
      console.warn('Intercom app id empty. Check that the environment is properly set')
      return
    }
    if (!isInjected()) {
      console.warn('Intercom called before injection')
      return
    }
    const intercomWindow = window as unknown as IntercomWindow
    intercomWindow.Intercom!(...args)
  }
}

class IntercomWidget {
  private _appId: string | undefined
  private _settings: IntercomSettings | undefined
  private client: ((...args: unknown[]) => void) | undefined

  static instance: IntercomWidget

  private constructor() {}

  static getInstance(): IntercomWidget {
    if (!this.instance) {
      this.instance = new IntercomWidget()
    }
    return this.instance
  }

  get appId(): string | undefined {
    return this._appId
  }

  set appId(id: string | undefined) {
    this._appId = id
  }

  get settings(): IntercomSettings | undefined {
    return this._settings
  }

  set settings(settings: IntercomSettings | undefined) {
    this._settings = settings
    if (settings && typeof window !== 'undefined') {
      const intercomWindow = window as unknown as IntercomWindow
      intercomWindow.intercomSettings = settings
    }
  }

  init(appId: string, settings?: IntercomSettings) {
    this.appId = appId
    this.client = getWindowClient(appId)
    if (settings) {
      this.settings = settings
    }
  }

  inject() {
    return new Promise<void>((resolve, reject) => {
      if (isInjected()) {
        return resolve()
      }
      const script = insertScript({
        src: `https://widget.intercom.io/widget/${this._appId}`
      })
      script.addEventListener('load', () => resolve(), true)
      script.addEventListener('error', () => reject(new Error('Failed to load Intercom script')), true)
    }).then(() => {
      if (!this._appId) {
        throw new Error('No AppId defined')
      }
      this.client = getWindowClient(this._appId)
    })
  }

  render(data: Record<string, unknown> = {}) {
    if (!this.client) {
      throw new Error('Client not initialized')
    }
    this.client('reattach_activator')
    // eslint-disable-next-line @typescript-eslint/naming-convention
    this.client('update', { ...data, app_id: this._appId })
  }

  unmount() {
    if (!this.client) {
      throw new Error('Client not initialized')
    }
    this.client('shutdown')
  }
}

export { IntercomWidget }
