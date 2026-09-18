#!/usr/bin/env node
// Enforces the dual-shell boundary: code reachable from a lightweight route must never pull in
// `src/shells/*` at runtime, because that drags the Redux store and the heavy dependency tree
// into the bundle every visitor downloads.
//
// A grep for `from '.*shells/'` cannot do this. It misses a lightweight component that reaches
// the shell through a helper or a barrel, and it flags the heavy route trees that are allowed to
// import the shell. This walks the import graph from the lightweight entry points instead, and
// reports the whole chain so the fix is obvious.
//
// `import type` / `export type` are ignored: they disappear at build time.
//
// Usage: node scripts/check-shell-boundary.mjs [--dir src]
// Exit codes: 0 clean, 1 violations, 2 usage / IO error.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const SHELL_DIR = 'shells'
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']

// Route groups that render inside DappsShell. Everything under them may import the shell.
const HEAVY_PAGE_DIRS = ['whats-on', 'blog', 'jump', 'social', 'discover', 'cast', 'storage', 'account', 'profile']

// Entry points that ship on the lightweight tier. Anything they can reach must stay shell-free.
const LIGHTWEIGHT_ROOTS = ['main.tsx', 'components/Layout', 'components/LandingNavbar', 'components/LandingFooter', 'pages']

// `src/App.tsx` is the one authorized reference: it lazy-imports the shell to code-split it.
const AUTHORIZED_SHELL_IMPORTER = 'App.tsx'

class UsageError extends Error {}

function parseArgs(argv) {
  const options = { dir: 'src' }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--dir') {
      const value = argv[i + 1]
      if (value === undefined || value.startsWith('--')) throw new UsageError('--dir expects a value')
      options.dir = value
      i += 1
    } else if (argv[i].startsWith('--')) {
      throw new UsageError(`unknown option ${argv[i]}`)
    }
  }
  options.dir = resolve(options.dir)
  return options
}

function listSourceFiles(dir) {
  const out = []
  const walk = current => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry)
      if (statSync(full).isDirectory()) {
        if (entry === '__mocks__' || entry === '__test-utils__') continue
        walk(full)
      } else if (EXTENSIONS.some(ext => entry.endsWith(ext)) && !/\.(spec|test)\.[jt]sx?$/.test(entry)) {
        out.push(full)
      }
    }
  }
  walk(dir)
  return out
}

/** Relative runtime imports only. Type-only imports and packages are irrelevant to the bundle. */
function relativeImports(source) {
  const specifiers = []
  const pattern = /(?:^|\n)\s*(?:import|export)\s+([\s\S]*?)from\s*['"](\.[^'"]*)['"]/g
  for (const match of source.matchAll(pattern)) {
    const clause = match[1]
    if (/^\s*type\s/.test(clause)) continue
    specifiers.push(match[2])
  }
  // Bare side-effect imports: `import './thing'`
  for (const match of source.matchAll(/(?:^|\n)\s*import\s*['"](\.[^'"]*)['"]/g)) specifiers.push(match[1])
  // Dynamic imports, including the lazy() form.
  for (const match of source.matchAll(/import\(\s*['"](\.[^'"]*)['"]\s*\)/g)) specifiers.push(match[1])
  return specifiers
}

function resolveImport(fromFile, specifier) {
  const base = resolve(dirname(fromFile), specifier)
  for (const ext of EXTENSIONS) if (existsSync(base + ext)) return base + ext
  if (existsSync(base) && statSync(base).isDirectory()) {
    for (const ext of EXTENSIONS) {
      const indexFile = join(base, `index${ext}`)
      if (existsSync(indexFile)) return indexFile
    }
  }
  return existsSync(base) && statSync(base).isFile() ? base : null
}

function isShellFile(file, dir) {
  return relative(dir, file).split('/')[0] === SHELL_DIR
}

function isHeavy(file, dir) {
  const parts = relative(dir, file).split('/')
  if (parts[0] === SHELL_DIR) return true
  return parts[0] === 'pages' && HEAVY_PAGE_DIRS.includes(parts[1])
}

function isLightweightRoot(file, dir) {
  const rel = relative(dir, file)
  if (isHeavy(file, dir)) return false
  return LIGHTWEIGHT_ROOTS.some(root => rel === root || rel.startsWith(`${root}/`))
}

/**
 * Walks out from every lightweight root and returns the first chain that reaches the shell.
 * Heavy files are not traversed: reaching one means the code was pulled in by a heavy route,
 * which is the split working as intended.
 */
function findViolations(files, dir) {
  const sources = new Map(files.map(file => [file, readFileSync(file, 'utf8')]))
  const violations = []
  const reported = new Set()

  for (const root of files.filter(file => isLightweightRoot(file, dir))) {
    const queue = [[root]]
    const seen = new Set([root])
    while (queue.length) {
      const chain = queue.shift()
      const current = chain[chain.length - 1]
      for (const specifier of relativeImports(sources.get(current) ?? '')) {
        const target = resolveImport(current, specifier)
        if (!target || !sources.has(target)) continue
        if (isShellFile(target, dir)) {
          if (relative(dir, current) === AUTHORIZED_SHELL_IMPORTER) continue
          const key = `${relative(dir, root)} -> ${relative(dir, target)}`
          if (reported.has(key)) continue
          reported.add(key)
          violations.push([...chain, target].map(file => relative(dir, file)))
          continue
        }
        if (isHeavy(target, dir) || seen.has(target)) continue
        seen.add(target)
        queue.push([...chain, target])
      }
    }
  }
  return violations
}

function run(argv, io) {
  const { dir } = parseArgs(argv)
  if (!existsSync(dir)) throw new UsageError(`source directory not found: ${dir}`)

  const files = listSourceFiles(dir)
  const violations = findViolations(files, dir)

  io.log(`shell boundary: ${files.length} files, ${files.filter(f => isLightweightRoot(f, dir)).length} lightweight entry points`)
  if (!violations.length) {
    io.log('OK: no lightweight route reaches src/shells')
    return 0
  }
  io.log(`FAIL: ${violations.length} lightweight path(s) reach src/shells`)
  for (const chain of violations) io.log(`  ${chain.join('\n    -> ')}`)
  return 1
}

try {
  process.exitCode = run(process.argv.slice(2), { log: line => process.stdout.write(`${line}\n`) })
} catch (error) {
  process.stderr.write(`check-shell-boundary: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 2
}
