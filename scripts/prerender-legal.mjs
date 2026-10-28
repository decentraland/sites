/**
 * Post-build script: writes each legal page as standalone semantic HTML into dist/legal/.
 *
 * The pages are client-side rendered, so the HTML served for /content, /terms and /privacy
 * carries an empty #root and a non-JS client reads no policy text. These artifacts ship in
 * the published bundle and the sites-deployer worker injects the matching one into #root.
 * Rendering the same components the SPA mounts is what keeps the two from drifting.
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

// A page that renders to almost nothing means the component tree broke without throwing.
// Publishing that as the legal text is worse than publishing none, so the build fails.
const MIN_PAGE_BYTES = 1000

if (!existsSync(distPath)) {
  console.error(`❌ Legal prerender failed: ${distPath} not found. Was the build step successful?`)
  process.exit(1)
}

await build({
  root,
  logLevel: 'warn',
  configFile: resolve(root, 'vite.config.ts'),
  // decentraland-ui2 ships ESM with extensionless relative imports that Node refuses to
  // resolve. Bundling it also lets vite.config's Emotion transform run over its .styled.js
  // files, without which component selectors resolve to NO_COMPONENT_SELECTOR and render
  // throws. React stays external so the entry and the bundled tree share one instance.
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
  if (html.length < MIN_PAGE_BYTES) {
    console.error(`❌ Legal prerender failed: /${slug} rendered ${html.length} bytes, expected a full document.`)
    process.exit(1)
  }
  writeFileSync(resolve(outDir, `${slug}.html`), html)
  console.log(`   /${slug} → dist/legal/${slug}.html (${(html.length / 1024).toFixed(1)} KB)`)
}

rmSync(tmpDir, { recursive: true, force: true })

console.log('✅ Legal pages prerendered into dist/legal/')
