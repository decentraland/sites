import { chromium, devices } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildIdentityFromEnv } from './identity.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const BASE_URL = (process.env.BASE_URL || '').replace(/\/$/, '')
if (!BASE_URL) {
  console.error('BASE_URL is required (e.g. BASE_URL=https://sites-pr-123.vercel.app)')
  process.exit(1)
}
try {
  const parsed = new URL(BASE_URL)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`unsupported protocol: ${parsed.protocol}`)
  }
} catch (err) {
  console.error(`BASE_URL is not a valid http(s) URL: ${err?.message ?? err}`)
  process.exit(1)
}

const OUTPUT_DIR = resolve(process.env.OUTPUT_DIR || join(__dirname, '../../screenshots'))
const NAV_TIMEOUT_MS = Number(process.env.NAV_TIMEOUT_MS || 30000)
const SETTLE_MS = Number(process.env.SETTLE_MS || 1500)
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY || 4))

const { routes } = JSON.parse(readFileSync(join(__dirname, 'routes.json'), 'utf8'))

const VIEWPORTS = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  // iPhone 13 device descriptor: realistic UA + dpr=3 so mobile-only CSS branches render.
  { name: 'mobile', ...devices['iPhone 13'] }
]

async function captureOne(context, route, viewportName) {
  const page = await context.newPage()
  const url = `${BASE_URL}${route.path}`
  const outPath = join(OUTPUT_DIR, viewportName, `${route.name}.png`)
  mkdirSync(dirname(outPath), { recursive: true })

  try {
    // 'load' waits for window.load (DOM + sub-resources) without requiring the
    // network to ever go idle. That matters for routes that hold long-lived
    // connections — /cast/* opens LiveKit websockets, and notification polling
    // can keep XHRs alive — where 'networkidle' would always hit NAV_TIMEOUT_MS.
    const response = await page.goto(url, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS })
    const status = response?.status() ?? 0
    await page.waitForTimeout(SETTLE_MS)
    await page.screenshot({ path: outPath, fullPage: true })
    return { ok: true, route: route.path, viewport: viewportName, status, file: outPath }
  } catch (err) {
    // Fallback: try to grab whatever rendered before the timeout.
    try {
      await page.screenshot({ path: outPath, fullPage: true })
    } catch {
      // Page never rendered — leave no artifact for this slot.
    }
    return { ok: false, route: route.path, viewport: viewportName, error: err?.message ?? String(err), file: outPath }
  } finally {
    await page.close().catch(() => {})
  }
}

async function runQueue(context, viewportName) {
  const queue = [...routes]
  const results = []
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const route = queue.shift()
      if (!route) break
      const r = await captureOne(context, route, viewportName)
      const tag = r.ok ? 'OK ' : 'ERR'
      const detail = r.ok ? `(${r.status})` : `— ${r.error}`
      console.log(`  ${tag} [${viewportName}] ${r.route} ${detail}`)
      results.push(r)
    }
  })
  await Promise.all(workers)
  return results
}

async function main() {
  const identity = await buildIdentityFromEnv()
  if (identity) {
    const masked = `${identity.address.slice(0, 6)}…${identity.address.slice(-4)}`
    console.log(`Auth: signed in as ${masked}`)
  } else {
    console.log('Auth: anonymous (no DCL_TEST_PRIVATE_KEY)')
  }

  console.log(`Capturing ${routes.length} routes × ${VIEWPORTS.length} viewports against ${BASE_URL}`)
  console.log(`Output: ${OUTPUT_DIR}`)

  const browser = await chromium.launch()
  const allResults = []

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n→ ${vp.name}`)
      const context = await browser.newContext({
        viewport: vp.viewport,
        deviceScaleFactor: vp.deviceScaleFactor,
        isMobile: vp.isMobile,
        hasTouch: vp.hasTouch,
        userAgent: vp.userAgent,
        locale: 'en-US',
        timezoneId: 'UTC'
      })
      // Seed @dcl/single-sign-on-client's localStorage entry before any page script
      // runs so useAuthIdentity / useWalletAddress see a signed-in session on first
      // render. addInitScript fires per-page, after document creation but before
      // any in-page <script> executes.
      if (identity) {
        await context.addInitScript(
          ({ key, value }) => {
            try {
              window.localStorage.setItem(key, value)
            } catch {
              // localStorage may be unavailable on rare error pages — skip silently.
            }
          },
          { key: `single-sign-on-${identity.address}`, value: identity.identityJson }
        )
      }
      const results = await runQueue(context, vp.name)
      allResults.push(...results)
      await context.close()
    }
  } finally {
    await browser.close()
  }

  const failures = allResults.filter(r => !r.ok)
  console.log(`\nDone. ${allResults.length - failures.length}/${allResults.length} captured.`)
  if (failures.length > 0) {
    console.log(`${failures.length} routes had navigation errors (partial screenshot may still exist):`)
    for (const f of failures) console.log(`  - [${f.viewport}] ${f.route}: ${f.error}`)
  }
  // Don't fail the run on per-route nav errors — partial captures are still useful for review.
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
