/**
 * Post-build script: writes the legal pages as standalone semantic HTML into
 * dist/legal/.
 *
 * Why: production HTML is served by the sites-deployer Cloudflare Worker, which
 * fetches this bundle from the CDN. A non-JS client (AI agent, crawler) asking
 * for /content, /terms or /privacy gets the SPA shell with an empty #root, so it
 * reads no policy text at all. The worker injects the matching artifact from this
 * directory into #root, and because the artifact is rendered from the very same
 * React component the SPA mounts, the two cannot drift.
 *
 * The artifact is text only: no emotion class names, no inline styles, no icons.
 * Its consumers read it, they don't paint it.
 *
 * Usage: node scripts/prerender-legal.mjs
 */

import { mkdirSync, rmSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { build } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const distPath = resolve(root, 'dist')
const outDir = resolve(distPath, 'legal')
const tmpDir = resolve(root, 'node_modules', '.tmp', 'prerender-legal')

if (!existsSync(distPath)) {
  console.error(`❌ Legal prerender failed: ${distPath} not found. Was the build step successful?`)
  process.exit(1)
}

// Compile the TSX entry through Vite so it resolves the same aliases, JSX runtime
// and package conditions the app build uses. `ssr` keeps React external and emits
// a plain Node module we can import below.
await build({
  root,
  logLevel: 'warn',
  configFile: resolve(root, 'vite.config.ts'),
  // decentraland-ui2 ships ESM with extensionless relative imports, which Node
  // refuses to resolve. Bundling it (rather than leaving it external) also lets
  // vite.config's Emotion transform run over its .styled.js files — without that
  // the component selectors resolve to NO_COMPONENT_SELECTOR and render throws.
  // React stays external so the entry and the bundled tree share one instance.
  ssr: { noExternal: true, external: ['react', 'react-dom', 'react-dom/server', 'react/jsx-runtime'] },
  build: {
    ssr: resolve(__dirname, 'prerender-legal.entry.tsx'),
    outDir: tmpDir,
    emptyOutDir: true,
    minify: false,
    sourcemap: false
  }
})

const { render } = await import(resolve(tmpDir, 'prerender-legal.entry.js'))
const pages = render()

if (!pages.length) {
  console.error('❌ Legal prerender failed: the entry rendered no pages.')
  process.exit(1)
}

mkdirSync(outDir, { recursive: true })

for (const { slug, html } of pages) {
  // A page that renders to almost nothing means the component tree broke without
  // throwing (a provider swallowed it, a lazy boundary never resolved). Serving
  // that as the legal text is worse than serving nothing, so fail the build.
  if (html.length < 1000) {
    console.error(`❌ Legal prerender failed: /${slug} rendered ${html.length} bytes, expected a full document.`)
    process.exit(1)
  }
  writeFileSync(resolve(outDir, `${slug}.html`), html)
  console.log(`   /${slug} → dist/legal/${slug}.html (${(html.length / 1024).toFixed(1)} KB)`)
}

rmSync(tmpDir, { recursive: true, force: true })

console.log('✅ Legal pages prerendered into dist/legal/')
