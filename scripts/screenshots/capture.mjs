import { chromium, devices } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildIdentityFromEnv } from './identity.mjs'
import { diffPngBuffers } from './diff.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

function validateUrl(name, raw) {
  if (!raw) return null
  const stripped = raw.replace(/\/$/, '')
  try {
    const parsed = new URL(stripped)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`unsupported protocol: ${parsed.protocol}`)
    }
  } catch (err) {
    console.error(`${name} is not a valid http(s) URL: ${err?.message ?? err}`)
    process.exit(1)
  }
  return stripped
}

const BASE_URL = validateUrl('BASE_URL', process.env.BASE_URL)
if (!BASE_URL) {
  console.error('BASE_URL is required (e.g. BASE_URL=https://sites-pr-123.vercel.app)')
  process.exit(1)
}
const BASELINE_URL = validateUrl('BASELINE_URL', process.env.BASELINE_URL)

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

function parsePercent(name, fallback) {
  const raw = process.env[name]
  if (raw == null || raw === '') return fallback
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    throw new Error(`${name} must be a percentage in [0, 100], got: ${JSON.stringify(raw)}`)
  }
  return n
}

const NAV_TIMEOUT_MS = parsePositiveInt('NAV_TIMEOUT_MS', 30000)
const SETTLE_MS = parsePositiveInt('SETTLE_MS', 1500)
const CONCURRENCY = Math.max(1, Math.floor(parsePositiveInt('CONCURRENCY', 4)))
// In diff mode, only persist routes whose pixel-difference exceeds this percent.
// 0.5% (~1700px on a 1440x230 viewport) filters out antialiasing/font-hinting
// noise while catching anything visually meaningful.
const DIFF_THRESHOLD_PERCENT = parsePercent('DIFF_THRESHOLD_PERCENT', 0.5)

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

async function capturePageBuffer(context, url) {
  const page = await context.newPage()
  try {
    const response = await page.goto(url, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS })
    const status = response?.status() ?? 0

    await page.evaluate(() => document.fonts?.ready).catch(() => {})

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

    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})

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
    const buffer = await page.screenshot({ fullPage: true, type: 'png' })
    return { ok: true, status, buffer }
  } catch (err) {
    let buffer
    try {
      buffer = await page.screenshot({ fullPage: true, type: 'png' })
    } catch (innerErr) {
      console.warn(`    fallback screenshot failed: ${innerErr?.message ?? innerErr}`)
    }
    return { ok: false, error: err?.message ?? String(err), buffer }
  } finally {
    await page.close().catch(() => {})
  }
}

async function captureRouteStandalone(context, route, viewportName, placeholders) {
  const resolvedPath = resolvePath(route.path, placeholders)
  const url = `${BASE_URL}${resolvedPath}`
  const outPath = join(OUTPUT_DIR, viewportName, `${route.name}.png`)
  const result = await capturePageBuffer(context, url)
  if (result.buffer) writeFileSync(outPath, result.buffer)
  return { ...result, route: resolvedPath, viewport: viewportName, file: outPath, mode: 'standalone' }
}

async function captureRouteDiff(targetContext, baselineContext, route, viewportName, placeholders) {
  const resolvedPath = resolvePath(route.path, placeholders)
  if (route.diff === false) {
    return { ok: true, skipped: true, reason: 'diff opt-out', route: resolvedPath, viewport: viewportName, mode: 'diff' }
  }

  const baseline = await capturePageBuffer(baselineContext, `${BASELINE_URL}${resolvedPath}`)
  const target = await capturePageBuffer(targetContext, `${BASE_URL}${resolvedPath}`)

  if (!baseline.buffer || !target.buffer) {
    return {
      ok: false,
      route: resolvedPath,
      viewport: viewportName,
      error: `nav failed (baseline=${baseline.ok ? 'ok' : baseline.error}, target=${target.ok ? 'ok' : target.error})`,
      mode: 'diff'
    }
  }

  const { diffBuffer, percent, changedPixels, totalPixels } = diffPngBuffers(baseline.buffer, target.buffer)

  if (percent < DIFF_THRESHOLD_PERCENT) {
    return {
      ok: true,
      skipped: true,
      reason: `under threshold (${percent.toFixed(2)}% < ${DIFF_THRESHOLD_PERCENT}%)`,
      route: resolvedPath,
      viewport: viewportName,
      percent,
      mode: 'diff'
    }
  }

  const dir = join(OUTPUT_DIR, viewportName, route.name)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'baseline.png'), baseline.buffer)
  writeFileSync(join(dir, 'target.png'), target.buffer)
  writeFileSync(join(dir, 'diff.png'), diffBuffer)
  writeFileSync(
    join(dir, 'meta.json'),
    JSON.stringify(
      {
        route: resolvedPath,
        viewport: viewportName,
        baselineUrl: `${BASELINE_URL}${resolvedPath}`,
        targetUrl: `${BASE_URL}${resolvedPath}`,
        changedPixels,
        totalPixels,
        percent
      },
      null,
      2
    )
  )

  return {
    ok: true,
    route: resolvedPath,
    viewport: viewportName,
    percent,
    changedPixels,
    totalPixels,
    file: dir,
    mode: 'diff'
  }
}

async function runQueue({ targetContext, baselineContext, viewportName, placeholders }) {
  const queue = [...routes]
  const results = []
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const route = queue.shift()
      if (!route) break
      const r = baselineContext
        ? await captureRouteDiff(targetContext, baselineContext, route, viewportName, placeholders)
        : await captureRouteStandalone(targetContext, route, viewportName, placeholders)

      let tag, detail
      if (r.skipped) {
        tag = '–'
        detail = r.reason
      } else if (r.ok) {
        tag = 'OK '
        detail = r.percent != null ? `${r.percent.toFixed(2)}% diff` : `(${r.status ?? '?'})`
      } else {
        tag = 'ERR'
        detail = `— ${r.error}`
      }
      console.log(`  ${tag} [${viewportName}] ${r.route} ${detail}`)
      results.push(r)
    }
  })
  await Promise.all(workers)
  return results
}

function buildContextOptions(vp) {
  return {
    viewport: vp.viewport,
    deviceScaleFactor: vp.deviceScaleFactor,
    isMobile: vp.isMobile,
    hasTouch: vp.hasTouch,
    userAgent: vp.userAgent,
    locale: 'en-US',
    timezoneId: 'UTC',
    reducedMotion: 'reduce'
  }
}

async function attachIdentity(context, identity) {
  if (!identity) return
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

  if (BASELINE_URL) {
    console.log(`Mode: diff — target ${BASE_URL} vs baseline ${BASELINE_URL}`)
    console.log(`Threshold: ${DIFF_THRESHOLD_PERCENT}% pixel difference (saving baseline+target+diff above this)`)
  } else {
    console.log(`Mode: standalone capture against ${BASE_URL}`)
  }
  console.log(`Routes: ${routes.length} × ${VIEWPORTS.length} viewports`)
  console.log(`Output: ${OUTPUT_DIR}`)

  const browser = await chromium.launch()
  const allResults = []

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n→ ${vp.name}`)
      const targetContext = await browser.newContext(buildContextOptions(vp))
      await attachIdentity(targetContext, identity)

      let baselineContext = null
      if (BASELINE_URL) {
        baselineContext = await browser.newContext(buildContextOptions(vp))
        await attachIdentity(baselineContext, identity)
      } else {
        mkdirSync(join(OUTPUT_DIR, vp.name), { recursive: true })
      }

      const results = await runQueue({ targetContext, baselineContext, viewportName: vp.name, placeholders })
      allResults.push(...results)

      await targetContext.close()
      await baselineContext?.close()
    }
  } finally {
    await browser.close()
  }

  const failures = allResults.filter(r => !r.ok)
  const captured = allResults.filter(r => r.ok && !r.skipped)
  const skipped = allResults.filter(r => r.skipped)
  console.log(`\nDone. captured=${captured.length} skipped=${skipped.length} failed=${failures.length}`)

  if (BASELINE_URL) {
    const summaryPath = join(OUTPUT_DIR, '_summary.json')
    mkdirSync(OUTPUT_DIR, { recursive: true })
    writeFileSync(
      summaryPath,
      JSON.stringify(
        {
          baselineUrl: BASELINE_URL,
          targetUrl: BASE_URL,
          thresholdPercent: DIFF_THRESHOLD_PERCENT,
          generatedAt: new Date().toISOString(),
          results: allResults.map(r => ({
            route: r.route,
            viewport: r.viewport,
            percent: r.percent ?? null,
            skipped: !!r.skipped,
            reason: r.reason ?? null,
            error: r.error ?? null
          }))
        },
        null,
        2
      )
    )
    console.log(`Summary: ${summaryPath}`)
  }

  if (failures.length > 0) {
    console.log(`${failures.length} routes had navigation errors:`)
    for (const f of failures) console.log(`  - [${f.viewport}] ${f.route}: ${f.error}`)
  }
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
