import macosBraveStepOne from '../../images/download/steps/macos-brave-step1.webp'
import macosChromeStepOne from '../../images/download/steps/macos-chrome-step1.webp'
import macosFirefoxStepOne from '../../images/download/steps/macos-firefox-step1.webp'
import macosOperaStepOne from '../../images/download/steps/macos-opera-step1.webp'
import macosSafariStepOne from '../../images/download/steps/macos-safari-step1.webp'
import windowsBraveStepOne from '../../images/download/steps/windows-brave-step1.webp'
import windowsChromeStepOne from '../../images/download/steps/windows-chrome-step1.webp'
import windowsEdgeStepOne from '../../images/download/steps/windows-edge-step1.webp'
import windowsFirefoxStepOne from '../../images/download/steps/windows-firefox-step1.webp'
import windowsOperaStepOne from '../../images/download/steps/windows-opera-step1.webp'
import { OperativeSystem } from '../../types/download.types'
import { DownloadBrowser } from './DownloadSuccess.types'
import type { DownloadStepOneVariant } from './DownloadSuccess.types'

// Highlight centers are measured on the final webp files: the center of the native download icon that each
// screenshot shows (Chrome: the active download button; Firefox: the circular downloads icon; Brave, Opera, Edge:
// the download arrow; Safari: the circled arrow). The highlight disc is drawn over it.
const MACOS_CHROME: DownloadStepOneVariant = { image: macosChromeStepOne, highlight: { x: 75.82, y: 47.81 } }
const WINDOWS_CHROME: DownloadStepOneVariant = { image: windowsChromeStepOne, highlight: { x: 75, y: 45.42 } }
const WINDOWS_EDGE: DownloadStepOneVariant = { image: windowsEdgeStepOne, highlight: { x: 75.63, y: 36.98 } }

const STEP_ONE_VARIANTS: Record<OperativeSystem, Partial<Record<DownloadBrowser, DownloadStepOneVariant>>> = {
  [OperativeSystem.MACOS]: {
    [DownloadBrowser.CHROME]: MACOS_CHROME,
    [DownloadBrowser.FIREFOX]: { image: macosFirefoxStepOne, highlight: { x: 77.28, y: 40.21 } },
    [DownloadBrowser.BRAVE]: { image: macosBraveStepOne, highlight: { x: 64.47, y: 46.15 } },
    [DownloadBrowser.OPERA]: { image: macosOperaStepOne, highlight: { x: 68.78, y: 35.21 } },
    [DownloadBrowser.SAFARI]: { image: macosSafariStepOne, highlight: { x: 49.37, y: 26.25 } },
    // No macOS Edge capture was designed: it reuses the Windows one.
    [DownloadBrowser.EDGE]: WINDOWS_EDGE
  },
  [OperativeSystem.WINDOWS]: {
    [DownloadBrowser.CHROME]: WINDOWS_CHROME,
    [DownloadBrowser.FIREFOX]: { image: windowsFirefoxStepOne, highlight: { x: 76.46, y: 41.35 } },
    [DownloadBrowser.BRAVE]: { image: windowsBraveStepOne, highlight: { x: 63.64, y: 42.92 } },
    [DownloadBrowser.OPERA]: { image: windowsOperaStepOne, highlight: { x: 68.4, y: 38.75 } },
    [DownloadBrowser.EDGE]: WINDOWS_EDGE
  }
}

const BROWSER_BY_NAME: Record<string, DownloadBrowser> = {
  chrome: DownloadBrowser.CHROME,
  firefox: DownloadBrowser.FIREFOX,
  brave: DownloadBrowser.BRAVE,
  opera: DownloadBrowser.OPERA,
  edge: DownloadBrowser.EDGE,
  safari: DownloadBrowser.SAFARI
}

// Matches the browser by name only: sharing an engine (Chromium, WebKit) says nothing about the toolbar.
// Mobile variants ("Mobile Safari") and Opera GX map to their base browser.
function resolveDownloadBrowser(name?: string): DownloadBrowser {
  const normalized =
    name
      ?.trim()
      .toLowerCase()
      .replace(/^mobile /, '')
      .replace(/ gx$/, '') ?? ''
  return BROWSER_BY_NAME[normalized] ?? DownloadBrowser.CHROME
}

function getStepOneVariant(os: OperativeSystem, browser: DownloadBrowser): DownloadStepOneVariant {
  const variants = STEP_ONE_VARIANTS[os]
  return variants[browser] ?? variants[DownloadBrowser.CHROME]!
}

export { getStepOneVariant, resolveDownloadBrowser }
