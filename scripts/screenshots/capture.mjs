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
function parsePositiveInt(name, fallback) {
  const raw = process.env[name]
  if (raw == null || raw === '') return fallback
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`${name} must be a positive number, got: ${JSON.stringify(raw)}`)
  }
  return n
}

const NAV_TIMEOUT_MS = parsePositiveInt('NAV_TIMEOUT_MS', 30000)
const SETTLE_MS = parsePositiveInt('SETTLE_MS', 1500)
const CONCURRENCY = Math.max(1, Math.floor(parsePositiveInt('CONCURRENCY', 4)))

const { routes } = JSON.parse(readFileSync(join(__dirname, 'routes.json'), 'utf8'))

// Address used for {address} when no identity is configured. Lowest non-zero
// secp256k1 key — guaranteed to never collide with a real user, so the page
// renders its "unknown user" empty state.
const ANON_PLACEHOLDER_ADDRESS = '0x0000000000000000000000000000000000000001'

function resolvePath(path, placeholders) {
  return path.replace(/\{(\w+)\}/g, (_, key) => {
    const value = placeholders[key]
    if (value == null) {
      throw new Error(`Unknown placeholder {${key}} in route ${path}`)
    }
    return value
  })
}

const VIEWPORTS = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  // iPhone 13 device descriptor: realistic UA + dpr=3 so mobile-only CSS branches render.
  { name: 'mobile', ...devices['iPhone 13'] }
]

async function captureOne(context, route, viewportName, placeholders) {
  const page = await context.newPage()
  const resolvedPath = resolvePath(route.path, placeholders)
  const url = `${BASE_URL}${resolvedPath}`
  const outPath = join(OUTPUT_DIR, viewportName, `${route.name}.png`)

  try {
    // 'load' waits for window.load (DOM + sub-resources) without requiring the
    // network to ever go idle. That matters for routes that hold long-lived
    // connections — /cast/* opens LiveKit websockets, and notification polling
    // can keep XHRs alive — where 'networkidle' would always hit NAV_TIMEOUT_MS.
    const response = await page.goto(url, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS })
    const status = response?.status() ?? 0

    // Wait for web fonts so text doesn't render in the fallback face.
    await page.evaluate(() => document.fonts?.ready).catch(() => {})

    // Scroll the full page in chunks to trigger IntersectionObserver-driven
    // lazy components — events carousel, blog cards, image loading="lazy",
    // etc. Without this, the homepage screenshot is ~1400px tall (hero +
    // footer) instead of the ~5000px the real page renders.
    await page
      .evaluate(async () => {
        const step = Math.max(200, Math.floor(window.innerHeight * 0.8))
        let last = -1
        while (window.scrollY + window.innerHeight < document.body.scrollHeight && window.scrollY !== last) {
          last = window.scrollY
          window.scrollBy(0, step)
          await new Promise(r => setTimeout(r, 150))
        }
        window.scrollTo(0, document.body.scrollHeight)
        await new Promise(r => setTimeout(r, 200))
        window.scrollTo(0, 0)
      })
      .catch(() => {})

    // Best-effort wait for the network requests fired by lazy components to
    // finish. Bounded — pages that never go idle (cast websockets) fall through.
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})

    // Force any remaining loading="lazy" images to load eagerly, then wait for
    // them to settle. Cards rendered above-the-fold via scroll-triggered React
    // updates frequently still sit on placeholder thumbnails when we screenshot.
    await page
      .evaluate(async () => {
        document.querySelectorAll('img[loading="lazy"]').forEach(img => img.removeAttribute('loading'))
        const imgs = Array.from(document.images).filter(img => !img.complete)
        await Promise.all(
          imgs.map(
            img =>
              new Promise(resolve => {
                const done = () => resolve()
                img.addEventListener('load', done, { once: true })
                img.addEventListener('error', done, { once: true })
                setTimeout(done, 5000)
              })
          )
        )
      })
      .catch(() => {})

    await page.waitForTimeout(SETTLE_MS)
    await page.screenshot({ path: outPath, fullPage: true })
    return { ok: true, route: resolvedPath, viewport: viewportName, status, file: outPath }
  } catch (err) {
    // Fallback: try to grab whatever rendered before the timeout. A second
    // failure here usually means "the page never rendered anything paintable"
    // (expected — the nav already failed), but it can also mean disk/permission
    // issues we want to know about, so we log instead of swallowing silently.
    try {
      await page.screenshot({ path: outPath, fullPage: true })
    } catch (innerErr) {
      console.warn(`    fallback screenshot failed: ${innerErr?.message ?? innerErr}`)
    }
    return { ok: false, route: resolvedPath, viewport: viewportName, error: err?.message ?? String(err), file: outPath }
  } finally {
    await page.close().catch(() => {})
  }
}

async function runQueue(context, viewportName, placeholders) {
  const queue = [...routes]
  const results = []
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const route = queue.shift()
      if (!route) break
      const r = await captureOne(context, route, viewportName, placeholders)
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
  const placeholders = {
    address: identity?.address ?? ANON_PLACEHOLDER_ADDRESS
  }
  if (identity) {
    const masked = `${identity.address.slice(0, 6)}…${identity.address.slice(-4)}`
    console.log(`Auth: signed in as ${masked} (also drives {address} placeholders)`)
  } else {
    console.log(`Auth: anonymous (no DCL_TEST_PRIVATE_KEY); {address} routes use ${ANON_PLACEHOLDER_ADDRESS}`)
  }

  console.log(`Capturing ${routes.length} routes × ${VIEWPORTS.length} viewports against ${BASE_URL}`)
  console.log(`Output: ${OUTPUT_DIR}`)

  const browser = await chromium.launch()
  const allResults = []

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n→ ${vp.name}`)
      mkdirSync(join(OUTPUT_DIR, vp.name), { recursive: true })
      const context = await browser.newContext({
        viewport: vp.viewport,
        deviceScaleFactor: vp.deviceScaleFactor,
        isMobile: vp.isMobile,
        hasTouch: vp.hasTouch,
        userAgent: vp.userAgent,
        locale: 'en-US',
        timezoneId: 'UTC',
        // Freezes CSS animations / transitions so screenshots don't catch them
        // mid-frame, and disables auto-playing carousels that respect the pref.
        reducedMotion: 'reduce'
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
      const results = await runQueue(context, vp.name, placeholders)
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
