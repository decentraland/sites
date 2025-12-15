import type { AdvancedNavigatorUAData } from '@dcl/hooks'
import { OperativeSystem } from '../components/Landing/DownloadOptions/DownloadOptions.types'

const normalizeUserAgentArchitectureByOs = (userAgent: AdvancedNavigatorUAData, os: OperativeSystem): AdvancedNavigatorUAData => {
  if (os === OperativeSystem.MACOS) {
    userAgent.os.name = OperativeSystem.MACOS
    userAgent.cpu.architecture = 'unknown'
  } else if (os === OperativeSystem.WINDOWS) {
    userAgent.os.name = OperativeSystem.WINDOWS
    userAgent.cpu.architecture = 'amd64'
  }
  return userAgent
}

export { normalizeUserAgentArchitectureByOs }
