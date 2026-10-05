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

// Highlight centers are measured, not copied from the spec. Chrome, Opera, Safari and Edge show a native
// download icon: the center is the one of that glyph on the final webp (the Figma disc sits off it in some
// variants, macOS Opera ~7px lower). Firefox and Brave have no download icon in their screenshot: the center is
// the Figma highlight disc as drawn in the reference composite. The Brave slot is the gap between its shield/triangle
// icons and the sidebar icon; the Windows screenshot has the same toolbar, so it reuses the macOS slot.
const MACOS_CHROME: DownloadStepOneVariant = { image: macosChromeStepOne, highlight: { x: 73.54, y: 44.06 } }
const WINDOWS_CHROME: DownloadStepOneVariant = { image: windowsChromeStepOne, highlight: { x: 70.37, y: 46.35 } }
const WINDOWS_EDGE: DownloadStepOneVariant = { image: windowsEdgeStepOne, highlight: { x: 65.1, y: 38.12 } }

const BRAVE_HIGHLIGHT = { x: 29.82, y: 41.46 }

const STEP_ONE_VARIANTS: Record<OperativeSystem, Partial<Record<DownloadBrowser, DownloadStepOneVariant>>> = {
  [OperativeSystem.MACOS]: {
    [DownloadBrowser.CHROME]: MACOS_CHROME,
    [DownloadBrowser.FIREFOX]: { image: macosFirefoxStepOne, highlight: { x: 64.34, y: 49.79 } },
    [DownloadBrowser.BRAVE]: { image: macosBraveStepOne, highlight: BRAVE_HIGHLIGHT },
    [DownloadBrowser.OPERA]: { image: macosOperaStepOne, highlight: { x: 55.84, y: 39.79 } },
    [DownloadBrowser.SAFARI]: { image: macosSafariStepOne, highlight: { x: 56.28, y: 27.08 } },
    // No macOS Edge capture was designed: it reuses the Windows one.
    [DownloadBrowser.EDGE]: WINDOWS_EDGE
  },
  [OperativeSystem.WINDOWS]: {
    [DownloadBrowser.CHROME]: WINDOWS_CHROME,
    [DownloadBrowser.FIREFOX]: { image: windowsFirefoxStepOne, highlight: { x: 63.07, y: 48.54 } },
    [DownloadBrowser.BRAVE]: { image: windowsBraveStepOne, highlight: BRAVE_HIGHLIGHT },
    [DownloadBrowser.OPERA]: { image: windowsOperaStepOne, highlight: { x: 55.84, y: 43.54 } },
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
