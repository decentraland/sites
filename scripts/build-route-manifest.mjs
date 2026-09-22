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

import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { mkdirSync } from 'node:fs'

const require = createRequire(import.meta.url)
const ts = require('typescript')

const MANIFEST_VERSION = 1
// Enforcement starts here. The manifest lists the whole site so the worker can widen scope
// without a rebuild, but only paths under these prefixes are allowed to 404 today.
const ENFORCED_SCOPE = ['/events']

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
    throw new BuildError(`src/App.tsx:${line + 1} — a Route path must be a string literal for the manifest to resolve it`)
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

function collectRoutes(sourceFile) {
  const valid = new Set()
  const notFound = []

  const visit = (node, parentPath, siblings) => {
    let nextParent = parentPath

    if ((ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) && !ts.isJsxText(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node
      const tagName = opening.tagName.getText(sourceFile)

      // A `<Routes>` child that is an expression hides routes from this extractor, and a manifest
      // that under-reports turns a live page into a 404 at the edge. The same goes for a spread on
      // a Route: its path is not readable here. Refuse rather than emit a manifest missing them.
      if (tagName === 'Routes' && ts.isJsxElement(node)) {
        for (const child of node.children) {
          if (!ts.isJsxExpression(child) || isCommentOnly(child, sourceFile)) continue
          const { line } = sourceFile.getLineAndCharacterOfPosition(child.getStart(sourceFile))
          throw new BuildError(
            `src/App.tsx:${line + 1} — <Routes> has a computed child; every route must be a literal ` +
              `<Route> element or the manifest silently omits it`
          )
        }
      }

      if (tagName === 'Route' && opening.attributes.properties.some(ts.isJsxSpreadAttribute)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(opening.getStart(sourceFile))
        throw new BuildError(
          `src/App.tsx:${line + 1} — <Route> uses a spread attribute; its path cannot be read, so the ` +
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
                `src/App.tsx:${line + 1} — wildcard route "${resolved}" needs a marker comment above it: ` +
                  `{/* route-manifest: not-found */} or {/* route-manifest: redirect */}`
              )
            }
            if (marker === 'not-found') notFound.push(resolved)
            else valid.add(resolved)
          } else {
            valid.add(resolved)
          }
          nextParent = resolved
        } else if (isIndex) {
          valid.add(parentPath)
        }
      }
    }

    const children = ts.isJsxElement(node) ? node.children : []
    for (const child of children) visit(child, nextParent, children)
    if (!ts.isJsxElement(node)) ts.forEachChild(node, child => visit(child, nextParent, []))
  }

  visit(sourceFile, '/', [])
  return { valid: [...valid].sort(), notFound: notFound.sort() }
}

/**
 * The grammar the edge matcher implements. Anything else (an optional `:id?`, a wildcard mid-path)
 * would be matched there with different semantics than React Router uses here, so it fails the
 * build rather than shipping a manifest the worker will read differently.
 */
function assertSupportedPattern(pattern) {
  if (pattern === '*') return
  const segments = pattern.split('/').slice(1)
  for (const segment of segments) {
    const unsupported =
      (segment.includes('*') && segment !== '*') ||
      (segment === '*' && segment !== segments[segments.length - 1]) ||
      segment.includes('?')
    if (unsupported) {
      throw new BuildError(
        `route "${pattern}" uses syntax the edge matcher does not implement (optional params and ` +
          `mid-path wildcards); support it there first or rewrite the route`
      )
    }
  }
}

function buildManifest(srcPath) {
  const source = readFileSync(srcPath, 'utf8')
  const sourceFile = ts.createSourceFile(srcPath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const { valid, notFound } = collectRoutes(sourceFile)

  if (!valid.length) throw new BuildError(`no routes found in ${srcPath}; refusing to emit an empty manifest`)

  for (const pattern of [...valid, ...notFound]) assertSupportedPattern(pattern)

  return { version: MANIFEST_VERSION, enforcedScope: ENFORCED_SCOPE, routes: valid, notFoundRoutes: notFound }
}

function run(argv, io) {
  const { src, out, check } = parseArgs(argv)
  const manifest = buildManifest(resolve(src))
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`

  if (check) {
    io.log(`route manifest: ${manifest.routes.length} routes, ${manifest.notFoundRoutes.length} not-found wildcards`)
    for (const route of manifest.routes) io.log(`  ${route}`)
    return 0
  }

  mkdirSync(dirname(resolve(out)), { recursive: true })
  writeFileSync(resolve(out), serialized)
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
