import { useEffect } from 'react'
import { useWallet } from '@dcl/core-web3'
import { IntercomWidget } from './IntercomWidget'
import type { IntercomProps } from './Intercom.types'

// eslint-disable-next-line react/prop-types
const Intercom: React.FC<IntercomProps> = ({ appId, data = {}, settings = { alignment: 'right' } }) => {
  const widget = IntercomWidget.getInstance()
  const { address } = useWallet()

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
