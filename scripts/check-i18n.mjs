#!/usr/bin/env node
// Locale parity + JSON integrity check for src/intl/*.json.
//
// Why a dedicated script: JSON.parse silently keeps the last duplicate member, so any check
// that runs after parsing cannot see duplicates. This script walks the RAW text with
// jsonc-parser's visitor (strict mode: no comments, no trailing commas) and compares leaf
// key paths across locales.
//
// Debt is tracked as exact (locale, issue type, key) sets in a committed baseline, never as
// counts: fixing one key does not buy permission to omit a different one, and a resolved
// entry left in the baseline is reported so debt cannot come back silently.
//
// Usage:
//   node scripts/check-i18n.mjs [--dir src/intl] [--source en] [--baseline <file>] [--write-baseline]
// Positional arguments are ignored on purpose (lint-staged appends staged filenames; the
// check always runs over every locale so a partial stage cannot hide a mismatch).
//
// Exit codes: 0 clean (or matches baseline), 1 findings, 2 usage / IO error.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, join, relative, resolve } from 'node:path'

// jsonc-parser ships UMD + ESM builds without an `exports` map; createRequire avoids relying
// on Node's CJS named-export detection for a UMD bundle.
const require = createRequire(import.meta.url)
const { printParseErrorCode, visit } = require('jsonc-parser')

const STRICT = { disallowComments: true, allowTrailingComma: false, allowEmptyContent: false }
const PARITY_TYPES = ['missing', 'extra', 'mismatch']

function parseArgs(argv) {
  const options = { dir: 'src/intl', source: 'en', baseline: null, writeBaseline: false }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--dir' || arg === '--source' || arg === '--baseline') {
      const value = argv[i + 1]
      if (value === undefined || value.startsWith('--')) {
        throw new UsageError(`${arg} expects a value`)
      }
      options[arg.slice(2)] = value
      i += 1
    } else if (arg === '--write-baseline') {
      options.writeBaseline = true
    } else if (arg.startsWith('--')) {
      throw new UsageError(`unknown option ${arg}`)
    }
    // Anything else is a positional argument (lint-staged filenames): ignored by design.
  }
  options.dir = resolve(options.dir)
  options.baseline = resolve(options.baseline ?? join(options.dir, 'parity-baseline.json'))
  return options
}

class UsageError extends Error {}

/**
 * Strict structural validation on the raw text. Returns syntax errors and duplicate members
 * with 1-based line/column positions. Property names arrive already decoded from jsonc-parser,
 * so "a" and "a" collide as they do at runtime.
 */
function validateRaw(text) {
  const issues = []
  const seenPerObject = []
  let rootSeen = false
  let rootIsObject = false

  const markRoot = isObject => {
    if (!rootSeen) {
      rootSeen = true
      rootIsObject = isObject
    }
  }

  visit(
    text,
    {
      onObjectBegin: () => {
        markRoot(true)
        seenPerObject.push(new Set())
      },
      onObjectEnd: () => {
        seenPerObject.pop()
      },
      onArrayBegin: () => markRoot(false),
      onLiteralValue: () => markRoot(false),
      onObjectProperty: (name, _offset, _length, line, column, pathSupplier) => {
        const seen = seenPerObject[seenPerObject.length - 1]
        const keyPath = [...pathSupplier(), name].join('.')
        if (seen.has(name)) {
          issues.push({ type: 'duplicate', key: keyPath, line: line + 1, column: column + 1 })
        }
        seen.add(name)
      },
      onError: (code, _offset, _length, line, column) => {
        issues.push({ type: 'syntax', key: printParseErrorCode(code), line: line + 1, column: column + 1 })
      }
    },
    STRICT
  )

  if (rootSeen && !rootIsObject) {
    issues.push({ type: 'syntax', key: 'RootMustBeObject', line: 1, column: 1 })
  }
  if (!rootSeen && !issues.length) {
    issues.push({ type: 'syntax', key: 'ValueExpected', line: 1, column: 1 })
  }
  return issues
}

/** Flattens nested objects into `a.b.c -> typeof leaf`. Arrays and primitives are leaves. */
function collectLeaves(value, prefix, out) {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (child !== null && typeof child === 'object' && !Array.isArray(child)) {
      collectLeaves(child, path, out)
    } else {
      out.set(path, Array.isArray(child) ? 'array' : typeof child)
    }
  }
  return out
}

function compareLeaves(sourceLeaves, localeLeaves) {
  const issues = { missing: [], extra: [], mismatch: [] }
  for (const [key, type] of sourceLeaves) {
    if (!localeLeaves.has(key)) {
      issues.missing.push(key)
    } else if (localeLeaves.get(key) !== type) {
      issues.mismatch.push(key)
    }
  }
  for (const key of localeLeaves.keys()) {
    if (!sourceLeaves.has(key)) {
      issues.extra.push(key)
    }
  }
  for (const type of PARITY_TYPES) issues[type].sort()
  return issues
}

function readBaseline(path) {
  if (!existsSync(path)) return {}
  const raw = readFileSync(path, 'utf8')
  const structural = validateRaw(raw)
  if (structural.length) {
    throw new UsageError(`baseline ${path} is not strict JSON: ${structural.map(formatStructural).join(', ')}`)
  }
  const parsed = JSON.parse(raw)
  const baseline = {}
  for (const [locale, entry] of Object.entries(parsed)) {
    if (locale.startsWith('$')) continue
    baseline[locale] = {}
    for (const type of PARITY_TYPES) {
      baseline[locale][type] = new Set(Array.isArray(entry?.[type]) ? entry[type] : [])
    }
  }
  return baseline
}

function serializeBaseline(parityByLocale) {
  const out = {
    $comment:
      'Known locale parity debt, tracked as exact key sets. Regenerate with `npm run lint:i18n -- --write-baseline` after fixing keys; a growing diff here is new debt and needs a reason in the PR.'
  }
  for (const locale of Object.keys(parityByLocale).sort()) {
    const entry = {}
    for (const type of PARITY_TYPES) {
      if (parityByLocale[locale][type].length) entry[type] = parityByLocale[locale][type]
    }
    if (Object.keys(entry).length) out[locale] = entry
  }
  return `${JSON.stringify(out, null, 2)}\n`
}

function formatStructural(issue) {
  return issue.type === 'duplicate'
    ? `duplicate key "${issue.key}" at ${issue.line}:${issue.column}`
    : `${issue.key} at ${issue.line}:${issue.column}`
}

function run(argv, io) {
  const options = parseArgs(argv)
  const { dir, source, baseline: baselinePath, writeBaseline } = options
  if (!existsSync(dir)) throw new UsageError(`locale directory not found: ${dir}`)

  const baselineName = basename(baselinePath)
  const files = readdirSync(dir)
    .filter(name => name.endsWith('.json') && name !== baselineName)
    .sort()
  const sourceFile = `${source}.json`
  if (!files.includes(sourceFile)) throw new UsageError(`source locale ${sourceFile} not found in ${dir}`)

  const rel = path => relative(process.cwd(), path) || '.'
  io.log(`i18n check: ${rel(dir)} (source ${sourceFile})`)

  let failed = false
  const parsedByFile = new Map()

  for (const file of files) {
    const text = readFileSync(join(dir, file), 'utf8')
    const structural = validateRaw(text)
    if (structural.length) {
      failed = true
      for (const issue of structural) io.log(`  ${file}: ${formatStructural(issue)}`)
      continue
    }
    parsedByFile.set(file, collectLeaves(JSON.parse(text), '', new Map()))
  }

  const sourceLeaves = parsedByFile.get(sourceFile)
  if (!sourceLeaves) {
    io.log(`FAIL: ${sourceFile} is not strict JSON, parity skipped`)
    return 1
  }

  const parityByLocale = {}
  for (const [file, leaves] of parsedByFile) {
    if (file === sourceFile) continue
    parityByLocale[file.replace(/\.json$/, '')] = compareLeaves(sourceLeaves, leaves)
  }

  if (writeBaseline) {
    // A locale that failed strict parsing is absent from parityByLocale, so writing now would
    // drop its recorded debt and hide it once the file is fixed. Keep the old baseline intact.
    if (failed) {
      io.log('FAIL: baseline left unchanged — fix the errors above and run again')
      return 1
    }
    writeFileSync(baselinePath, serializeBaseline(parityByLocale))
    io.log(`baseline written: ${rel(baselinePath)}`)
    return 0
  }

  const baseline = readBaseline(baselinePath)
  const fresh = []
  const resolved = []
  for (const [locale, issues] of Object.entries(parityByLocale)) {
    const known = baseline[locale] ?? { missing: new Set(), extra: new Set(), mismatch: new Set() }
    const summary = PARITY_TYPES.map(type => `${type} ${issues[type].length} (baseline ${known[type].size})`).join('  ')
    io.log(`  ${locale}.json  ${summary}`)
    for (const type of PARITY_TYPES) {
      for (const key of issues[type]) if (!known[type].has(key)) fresh.push({ locale, type, key })
      for (const key of known[type]) if (!issues[type].includes(key)) resolved.push({ locale, type, key })
    }
  }
  for (const locale of Object.keys(baseline)) {
    if (!(locale in parityByLocale)) {
      for (const type of PARITY_TYPES) for (const key of baseline[locale][type]) resolved.push({ locale, type, key })
    }
  }

  if (fresh.length) {
    failed = true
    io.log('NEW (not in baseline):')
    for (const { locale, type, key } of fresh) io.log(`  ${locale}.json ${type}: ${key}`)
  }
  if (resolved.length) {
    failed = true
    io.log(`RESOLVED (still listed in ${rel(baselinePath)}, prune with --write-baseline):`)
    for (const { locale, type, key } of resolved) io.log(`  ${locale}.json ${type}: ${key}`)
  }

  io.log(failed ? `FAIL: ${fresh.length} new, ${resolved.length} resolved` : 'OK: matches baseline')
  return failed ? 1 : 0
}

try {
  process.exitCode = run(process.argv.slice(2), { log: line => process.stdout.write(`${line}\n`) })
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`check-i18n: ${message}\n`)
  process.exitCode = 2
}
