#!/usr/bin/env node
// Emits dist/routes.json: the paths this SPA actually serves, so the edge can answer 404 for a
// URL the router would send to the not-found page. Without it the worker only knows section
// prefixes, so `/events/anything` looks as real as `/events` — which is how a hallucinated link
// gets a 200 and an Events social card.
//
// The list is read out of src/App.tsx by walking the TypeScript AST. It is never derived from
// component names: a wildcard has to say whether it redirects or renders not-found, through a
// `{/* route-manifest: not-found */}` or `{/* route-manifest: redirect */}` comment right above
// it. Anything the walker cannot classify fails the build rather than shipping a manifest that
// would turn a live route into a 404.
//
// Usage: node scripts/build-route-manifest.mjs [--src src/App.tsx] [--out dist/routes.json] [--check]

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve, sep } from 'node:path'

const require = createRequire(import.meta.url)
const ts = require('typescript')

const MANIFEST_VERSION = 1
// Which paths the edge may answer 404 for. `/` is the whole site: any path that matches no route
// gets a 404 instead of the shell with a 200.
//
// This only reaches paths whose route does not exist. It cannot reach a path whose route exists but
// whose ENTITY does not: `/blog/pepe` matches `/blog/:categorySlug` and still answers 200, because
// knowing the category is missing means asking the CMS, which is tracked separately.
//
// Note this is shipped INSIDE the manifest, so narrowing it needs a sites rebuild and rollout. The
// worker can override it (see `rollouts/route-manifest.ts`), which is the switch to use in an
// incident.
const ENFORCED_SCOPE = ['/']

class BuildError extends Error {}

function parseArgs(argv) {
  const options = { src: 'src/App.tsx', out: 'dist/routes.json', check: false }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--src' || argv[i] === '--out') {
      const value = argv[i + 1]
      if (value === undefined || value.startsWith('--')) throw new BuildError(`${argv[i]} expects a value`)
      options[argv[i].slice(2)] = value
      i += 1
    } else if (argv[i] === '--check') {
      options.check = true
    } else if (argv[i].startsWith('--')) {
      throw new BuildError(`unknown option ${argv[i]}`)
    }
  }
  return options
}

const joinPaths = (parent, child) => {
  if (child.startsWith('/')) return child
  if (!child) return parent
  return `${parent === '/' ? '' : parent}/${child}`
}

/** The literal value of `path="..."`. A non-literal path cannot be resolved at build time. */
function readPathAttribute(element, sourceFile) {
  const attributes = element.attributes.properties
  for (const attribute of attributes) {
    if (!ts.isJsxAttribute(attribute) || attribute.name.getText(sourceFile) !== 'path') continue
    const initializer = attribute.initializer
    if (initializer && ts.isStringLiteral(initializer)) return initializer.text
    const { line } = sourceFile.getLineAndCharacterOfPosition(attribute.getStart(sourceFile))
    throw new BuildError(`${sourceFile.fileName}:${line + 1} — a Route path must be a string literal for the manifest to resolve it`)
  }
  return null
}

const hasIndexAttribute = (element, sourceFile) =>
  element.attributes.properties.some(attribute => ts.isJsxAttribute(attribute) && attribute.name.getText(sourceFile) === 'index')

/**
 * Classification comes from a marker comment, never from the element itself. Returns
 * 'not-found' | 'redirect' | null, reading the JSX expression containers that precede this route
 * inside its parent.
 */
function readMarker(node, siblings, sourceFile) {
  const index = siblings.indexOf(node)
  for (let i = index - 1; i >= 0; i -= 1) {
    const previous = siblings[i]
    if (ts.isJsxText(previous)) {
      if (previous.getText(sourceFile).trim() === '') continue
      return null
    }
    if (ts.isJsxExpression(previous)) {
      const text = previous.getFullText(sourceFile)
      const match = text.match(/route-manifest:\s*(not-found|redirect)/)
      return match ? match[1] : null
    }
    return null
  }
  return null
}

// A marker like {/`*` route-manifest: not-found `*`/} parses as an expression node carrying only a
// comment and no expression. That is the one computed child that is not hiding a route.
function isCommentOnly(expression, sourceFile) {
  if (expression.expression) return false
  return /\/\*[\s\S]*\*\//.test(expression.getText(sourceFile))
}

/**
 * Rejects a computed child in any node that composes routes, descending through fragments so
 * `<Routes><><Route />{extra}</></Routes>` is caught too. A marker comment is an expression node
 * with no `.expression`, which is the one computed child that hides nothing.
 */
function hasAttribute(opening, name, sourceFile) {
  return opening.attributes.properties.some(
    property => ts.isJsxAttribute(property) && property.name.getText(sourceFile) === name
  )
}

function assertNoComputedRoutes(node, sourceFile) {
  for (const child of node.children) {
    if (ts.isJsxFragment(child)) {
      assertNoComputedRoutes(child, sourceFile)
      continue
    }
    if (!ts.isJsxExpression(child) || isCommentOnly(child, sourceFile)) continue
    const { line } = sourceFile.getLineAndCharacterOfPosition(child.getStart(sourceFile))
    throw new BuildError(
      `${sourceFile.fileName}:${line + 1} — <${node.openingElement?.tagName?.getText(sourceFile) ?? 'fragment'}> has a ` +
        `computed child; every route must be a literal <Route> element or the manifest silently omits it`
    )
  }
}

function collectRoutes(sourceFile) {
  const valid = new Set()
  const notFound = new Set()

  const visit = (node, parentPath, siblings) => {
    let nextParent = parentPath

    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node
      const tagName = opening.tagName.getText(sourceFile)

      // An expression anywhere routes are composed hides routes from this extractor, and a manifest
      // that under-reports turns a live page into a 404 at the edge. `<Routes>` is not the only such
      // place: a `<Route>` nests children, and a fragment inside either one composes them too.
      if ((tagName === 'Routes' || tagName === 'Route') && ts.isJsxElement(node)) {
        assertNoComputedRoutes(node, sourceFile)
      }

      // `caseSensitive` changes how the router matches, and the manifest is a flat list of strings
      // with nowhere to carry it: the edge matches case-insensitively for everything. Rejected
      // rather than flattened, which would silently make the two disagree.
      if (tagName === 'Route' && hasAttribute(opening, 'caseSensitive', sourceFile)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(opening.getStart(sourceFile))
        throw new BuildError(
          `${sourceFile.fileName}:${line + 1} — <Route> sets caseSensitive, which the manifest cannot express ` +
            `and the edge matcher does not implement; add support on both sides first`
        )
      }

      if (tagName === 'Route' && opening.attributes.properties.some(ts.isJsxSpreadAttribute)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(opening.getStart(sourceFile))
        throw new BuildError(
          `${sourceFile.fileName}:${line + 1} — <Route> uses a spread attribute; its path cannot be read, so the ` +
            `manifest would silently omit this route`
        )
      }

      if (tagName === 'Route') {
        const path = readPathAttribute(opening, sourceFile)
        const isIndex = hasIndexAttribute(opening, sourceFile)

        if (path !== null) {
          const resolved = joinPaths(parentPath, path)
          if (resolved.includes('*')) {
            const marker = readMarker(node, siblings, sourceFile)
            if (!marker) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(opening.getStart(sourceFile))
              throw new BuildError(
                `${sourceFile.fileName}:${line + 1} — wildcard route "${resolved}" needs a marker comment above it: ` +
                  `{/* route-manifest: not-found */} or {/* route-manifest: redirect */}`
              )
            }
            if (marker === 'not-found') notFound.add(resolved)
            else valid.add(resolved)
          } else {
            valid.add(resolved)
          }
          nextParent = resolved
        } else if (isIndex) {
          // An index can BE the section's not-found screen, as `/cast` does. Without reading the
          // marker here the parent path is recorded as a live route and the edge answers 200 for a
          // URL the router sends to a not-found page.
          if (readMarker(node, siblings, sourceFile) === 'not-found') {
            // The parent <Route path="..."> already recorded this path as live on the way in.
            // Drop it: what renders here is the not-found screen, and leaving both entries makes
            // the edge tie-break in favour of the live route and answer 200.
            valid.delete(parentPath)
            notFound.add(parentPath)
          } else {
            valid.add(parentPath)
          }
        }
      }
    }

    if (ts.isJsxFragment(node)) assertNoComputedRoutes(node, sourceFile)

    const children = ts.isJsxElement(node) ? node.children : ts.isJsxFragment(node) ? node.children : []
    for (const child of children) visit(child, nextParent, children)
    if (!ts.isJsxElement(node) && !ts.isJsxFragment(node)) ts.forEachChild(node, child => visit(child, nextParent, []))
  }

  visit(sourceFile, '/', [])
  return { valid: [...valid].sort(), notFound: [...notFound].sort() }
}

/**
 * The grammar the edge matcher implements. Anything else (an optional `:id?`, a wildcard mid-path)
 * would be matched there with different semantics than React Router uses here, so it fails the
 * build rather than shipping a manifest the worker will read differently.
 */
function assertSupportedPattern(pattern) {
  if (pattern === '*') return
  const segments = pattern.split('/').slice(1)
  for (const [index, segment] of segments.entries()) {
    // Compared by INDEX, not by value: with `/events/*/x/*` the first `*` equals the last one, so a
    // value comparison lets a mid-path wildcard through and the worker then rejects the whole
    // manifest, disabling enforcement for the bundle.
    const unsupported =
      (segment.includes('*') && segment !== '*') || (segment === '*' && index !== segments.length - 1) || segment.includes('?')
    if (unsupported) {
      throw new BuildError(
        `route "${pattern}" uses syntax the edge matcher does not implement (optional params and ` +
          `mid-path wildcards); support it there first or rewrite the route`
      )
    }
  }
}

/** Routing APIs that declare routes. `Link`, `Navigate` and the hooks are fine: they only navigate. */
const ROUTING_COMPONENTS = new Set(['Route', 'Routes'])
const ROUTING_FACTORIES = new Set([
  'createBrowserRouter',
  'createHashRouter',
  'createMemoryRouter',
  'createRoutesFromElements',
  'useRoutes'
])

/**
 * Parses each file rather than grepping it, so `<RouteCard>`, a commented-out `<Route />` and the
 * string "createBrowserRouter" in a doc block do not fail the build. A regex flagged all three.
 */
function findRoutingDeclaration(filePath) {
  const sourceFile = ts.createSourceFile(filePath, readFileSync(filePath, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let found = null

  const visit = node => {
    if (found) return
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node
      // `RR.Route` counts too: the property name is what identifies the component.
      const tagName = opening.tagName.getText(sourceFile).split('.').pop()
      if (ROUTING_COMPONENTS.has(tagName)) found = { node: opening, name: `<${tagName}>` }
    } else if (ts.isCallExpression(node)) {
      const callee = node.expression.getText(sourceFile).split('.').pop()
      if (ROUTING_FACTORIES.has(callee)) found = { node, name: `${callee}()` }
    }
    if (!found) ts.forEachChild(node, visit)
  }
  visit(sourceFile)

  if (!found) return null
  const { line } = sourceFile.getLineAndCharacterOfPosition(found.node.getStart(sourceFile))
  return `${filePath}:${line + 1} — ${found.name}`
}

/**
 * The manifest is built from ONE file. If a second router ever appears, every route it declares is
 * missing from the manifest, and the edge answers 404 for pages that work — the exact failure this
 * whole mechanism is supposed to prevent, arriving silently. So the build refuses to emit until the
 * new router is either folded into App.tsx or the extractor learns to read it.
 */
function assertSingleRouter(srcPath, srcDir) {
  const offenders = []

  const walk = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = join(directory, entry.name)
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules') walk(full)
        continue
      }
      if (!/\.tsx?$/.test(entry.name) || /\.spec\.tsx?$/.test(entry.name)) continue
      if (resolve(full) === resolve(srcPath)) continue
      const offender = findRoutingDeclaration(full)
      if (offender) offenders.push(offender)
    }
  }
  walk(srcDir)

  if (offenders.length) {
    throw new BuildError(
      `routing is declared outside ${srcPath}, so the manifest would omit it and the edge would 404 ` +
        `those paths:\n  ${offenders.join('\n  ')}`
    )
  }
}

function buildManifest(srcPath, srcDir) {
  if (srcDir) assertSingleRouter(srcPath, srcDir)

  const source = readFileSync(srcPath, 'utf8')
  const sourceFile = ts.createSourceFile(srcPath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const { valid, notFound } = collectRoutes(sourceFile)

  if (!valid.length) throw new BuildError(`no routes found in ${srcPath}; refusing to emit an empty manifest`)

  for (const pattern of [...valid, ...notFound]) assertSupportedPattern(pattern)

  return { version: MANIFEST_VERSION, enforcedScope: ENFORCED_SCOPE, routes: valid, notFoundRoutes: notFound }
}

function run(argv, io) {
  const { src, out, check } = parseArgs(argv)
  // Only scanned for the repo's own router: a fixture in a temp dir has no tree to walk.
  const srcDir = resolve(src).endsWith(`${sep}src${sep}App.tsx`) ? dirname(resolve(src)) : null
  const manifest = buildManifest(resolve(src), srcDir)

  if (check) {
    io.log(`route manifest: ${manifest.routes.length} routes, ${manifest.notFoundRoutes.length} not-found wildcards`)
    for (const route of manifest.routes) io.log(`  ${route}`)
    return 0
  }

  mkdirSync(dirname(resolve(out)), { recursive: true })
  writeFileSync(resolve(out), `${JSON.stringify(manifest, null, 2)}\n`)
  io.log(`route manifest: ${manifest.routes.length} routes written to ${out}`)
  return 0
}

try {
  process.exitCode = run(process.argv.slice(2), { log: line => process.stdout.write(`${line}\n`) })
} catch (error) {
  process.stderr.write(`build-route-manifest: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
}

export { buildManifest }
