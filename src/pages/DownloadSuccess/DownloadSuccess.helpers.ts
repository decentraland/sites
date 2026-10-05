import macosChromeStepOne from '../../images/download/steps/macos-chrome-step1.webp'
import macosOperaStepOne from '../../images/download/steps/macos-opera-step1.webp'
import macosSafariStepOne from '../../images/download/steps/macos-safari-step1.webp'
import windowsChromeStepOne from '../../images/download/steps/windows-chrome-step1.webp'
import windowsEdgeStepOne from '../../images/download/steps/windows-edge-step1.webp'
import windowsOperaStepOne from '../../images/download/steps/windows-opera-step1.webp'
import { OperativeSystem } from '../../types/download.types'
import { DownloadBrowser } from './DownloadSuccess.types'
import type { DownloadStepOneVariant } from './DownloadSuccess.types'

// Highlight centers are measured on the final webp files (center of the visible download glyph),
// not copied from the Figma highlight disc, which sits off the native glyph in some variants
// (macOS Opera: ~7px lower).
const MACOS_CHROME: DownloadStepOneVariant = { image: macosChromeStepOne, highlight: { x: 73.54, y: 44.06 } }
const WINDOWS_CHROME: DownloadStepOneVariant = { image: windowsChromeStepOne, highlight: { x: 70.37, y: 46.35 } }
const WINDOWS_EDGE: DownloadStepOneVariant = { image: windowsEdgeStepOne, highlight: { x: 65.1, y: 38.12 } }

// TODO(download-steps): Firefox and Brave have no Step 1 asset yet (the design is being updated).
// They are left out on purpose and resolve to Chrome until their entries land here.
const STEP_ONE_VARIANTS: Record<OperativeSystem, Partial<Record<DownloadBrowser, DownloadStepOneVariant>>> = {
  [OperativeSystem.MACOS]: {
    [DownloadBrowser.CHROME]: MACOS_CHROME,
    [DownloadBrowser.OPERA]: { image: macosOperaStepOne, highlight: { x: 55.84, y: 39.79 } },
    [DownloadBrowser.SAFARI]: { image: macosSafariStepOne, highlight: { x: 56.28, y: 27.08 } },
    // No macOS Edge capture was designed: it reuses the Windows one.
    [DownloadBrowser.EDGE]: WINDOWS_EDGE
  },
  [OperativeSystem.WINDOWS]: {
    [DownloadBrowser.CHROME]: WINDOWS_CHROME,
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
