import { useEffect, useMemo } from 'react'
import { useWalletState } from '@dcl/core-web3/lazy'
import { IntercomWidget } from './IntercomWidget'
import type { IntercomProps, IntercomSettings } from './Intercom.types'

const DEFAULT_DATA: Record<string, unknown> = {}
const DEFAULT_SETTINGS: IntercomSettings = { alignment: 'right' }

// eslint-disable-next-line react/prop-types
const Intercom: React.FC<IntercomProps> = ({ appId, data = DEFAULT_DATA, settings = DEFAULT_SETTINGS }) => {
  const widget = useMemo(() => IntercomWidget.getInstance(), [])
  const { address } = useWalletState()

  useEffect(() => {
    if (!widget.appId) {
      widget.init(appId, settings)
    }

    const widgetData = {
      ...data,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ...(address ? { Wallet: address } : {})
    }

    const renderWidget = async () => {
      try {
        await widget.inject()
        widget.render(widgetData)
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Could not render intercom', message)
      }
    }

    renderWidget()

    return () => {
      try {
        widget.unmount()
      } catch {
        // widget may not be initialized on cleanup
      }
    }
  }, [appId, data, address, settings, widget])

  useEffect(() => {
    widget.settings = settings
  }, [settings, widget])

  return null
}

export { Intercom }
