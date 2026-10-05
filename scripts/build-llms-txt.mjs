#!/usr/bin/env node
// Emits dist/llms.txt from scripts/llms.template.md. The prose is marketing's; the links come from
// src/config/publicLinks.json (the file the site's download buttons and footer read) plus the
// llms.txt attribution rules below, so a store URL changed on the site changes here too.
//
// Every link in the output is validated and any failure fails the build: a link an LLM repeats to a
// user has to exist. decentraland.org links are checked against this SPA's route manifest, except the
// OTHER_SITE_URLS allowlist, which the build cannot verify. No network here; `npm run check:llms-links`
// does the live check, and it covers the allowlist plus every external link.
//
// Usage: node scripts/build-llms-txt.mjs [--template ...] [--links ...] [--routes dist/routes.json] [--out dist/llms.txt]

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildGooglePlayUrl } from '../src/modules/googlePlayUrl.js'

const SITE_ORIGIN = 'https://decentraland.org'
const SITE_HOST = 'decentraland.org'

const LLMS_UTM = { utm_source: 'llmstxt', utm_medium: 'referral' }

class BuildError extends Error {}

function withParams(rawUrl, params) {
  const url = new URL(rawUrl)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  return url.toString()
}

// Attribution per destination. Keys absent here (docs, social, help) ship untagged.
const ATTRIBUTION = {
  'download.desktop': url => withParams(url, LLMS_UTM),
  'download.epic': url => withParams(url, LLMS_UTM),
  // App Store Connect attributes by `ct` (campaign token) and ignores utm_*. `pt` (provider) and
  // `mt` (media type) are kept; the site's default `ct` is replaced, not appended to.
  'download.appStore': url => withParams(url, { ct: 'llmstxt' }),
  // Same builder the site uses, so the llms link carries the Install Referrer mirror too.
  'download.googlePlay': url => buildGooglePlayUrl(url, LLMS_UTM)
}

// decentraland.org URLs served by OTHER sites (not this SPA's router), as exact URLs. The value only
// names the owning site for the reader; nothing reads it. The build trusts these entries, so
// check-llms-links.mjs fetches them live. Only what the output publishes belongs here.
const OTHER_SITE_URLS = new Map([
  ['https://decentraland.org/shop', 'shop'],
  ['https://decentraland.org/marketplace', 'marketplace'],
  ['https://decentraland.org/builder', 'builder'],
  ['https://decentraland.org/dao', 'dao-landing'],
  ['https://decentraland.org/governance', 'governance-ui']
])

// The one dynamic SPA link the output publishes, checked against its route pattern.
const DYNAMIC_SPA_LINKS = [{ pattern: '/places/place/:position', path: /^\/places\/place\/-?\d+,-?\d+$/ }]

const PLACEHOLDER = /\{\{\s*([\w.]+)\s*\}\}/g
const MARKDOWN_LINK = /\[([^\]]*)\]\(([^)\s]*)\)/g

function lookupLink(links, key) {
  const value = key.split('.').reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), links)
  return typeof value === 'string' ? value : undefined
}

/** Strips HTML comments, fills every {{group.key}} placeholder, normalizes blank lines. */
function fillTemplate(template, links) {
  const withoutComments = template.replace(/<!--[\s\S]*?-->/g, '')
  const unknown = []
  const filled = withoutComments.replace(PLACEHOLDER, (_, key) => {
    const raw = lookupLink(links, key)
    if (raw === undefined) {
      unknown.push(key)
      return `{{${key}}}`
    }
    const attribute = ATTRIBUTION[key]
    return attribute ? attribute(raw) : raw
  })
  if (unknown.length) throw new BuildError(`unknown placeholder(s): ${unknown.join(', ')}`)
  return `${filled.replace(/\n{3,}/g, '\n\n').trim()}\n`
}

const normalizePath = path => (path.length > 1 ? path.replace(/\/$/, '') : path)

const PARAM_SEGMENT = /^:[\w-]+$/
// Not-found catch-alls that React Router ranks below `/places/place/:position` for any path.
const CATCH_ALLS_BELOW_DYNAMIC_LINKS = new Set(['*', '/*', '/places/*'])

/** Whether a manifest pattern (static, `:param` or trailing `*` segments) matches `path`. */
function matchesRoute(pattern, path) {
  const patternSegments = pattern.split('/').filter(Boolean)
  const pathSegments = path.split('/').filter(Boolean)
  for (const [index, segment] of patternSegments.entries()) {
    if (segment === '*') return true
    const value = pathSegments[index]
    if (value === undefined) return false
    if (!PARAM_SEGMENT.test(segment) && segment.toLowerCase() !== decodeURIComponent(value).toLowerCase()) return false
  }
  return patternSegments.length === pathSegments.length
}

function validateSitePath(url, manifest, otherSiteUrls) {
  if (otherSiteUrls.has(url.href)) return null
  const path = normalizePath(url.pathname)
  const isStatic = route => !route.includes(':') && !route.includes('*')
  if (manifest.routes.includes(path) && isStatic(path) && !manifest.notFoundRoutes.includes(path)) return null
  const dynamic = DYNAMIC_SPA_LINKS.find(link => link.path.test(path))
  if (dynamic) {
    if (!manifest.routes.includes(dynamic.pattern)) return `route ${dynamic.pattern} is not in the route manifest`
    // Only one dynamic link is published, so this is not a general router. The catch-alls listed in
    // CATCH_ALLS_BELOW_DYNAMIC_LINKS are known to rank below a full-length param route and are
    // ignored. Every other not-found route matching the path fails, whether or not the router would
    // pick it: a splat such as `/places/place/-3,-2/*` can match zero segments and outrank the param,
    // while `/:a/:b/:c` would not. Rejecting both is conservative: it can refuse a valid link, never
    // accept one the router sends to not-found.
    const blocker = manifest.notFoundRoutes.find(route => !CATCH_ALLS_BELOW_DYNAMIC_LINKS.has(route) && matchesRoute(route, path))
    return blocker ? `not-found route ${blocker} also matches ${path}` : null
  }
  return `${path} is not a route of this SPA nor an allowlisted URL of another decentraland.org site`
}

/** Returns every problem with the links in `text`, empty when all pass. */
function validateLinks(text, manifest, otherSiteUrls = OTHER_SITE_URLS) {
  const errors = []
  if (text.includes('{{')) errors.push('output still contains an unfilled {{ placeholder')
  // Inline `[text](url)` is the only link syntax the output may use, so every link goes through the
  // checks below. Anything else that reads as a link (reference links and their definitions, images,
  // raw HTML anchors, autolinks, bare URLs) is rejected rather than parsed.
  if (/!\[/.test(text)) errors.push('images are not supported; use an inline [text](url) link')
  const rest = text.replace(MARKDOWN_LINK, '')
  if (/[[\]]/.test(rest)) errors.push('brackets outside an inline [text](url) link (reference link or definition?)')
  if (/<a[\s>]/i.test(rest)) errors.push('raw HTML anchors are not supported; use an inline [text](url) link')
  if (/https?:\/\/|<[a-z][a-z0-9+.-]*:/i.test(rest)) errors.push('bare or autolinked URL; use an inline [text](url) link')
  for (const [, name, raw] of text.matchAll(MARKDOWN_LINK)) {
    const label = `[${name}](${raw})`
    if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
      errors.push(`${label}: relative link; llms.txt links must be absolute`)
      continue
    }
    let url
    try {
      url = new URL(raw, SITE_ORIGIN)
    } catch {
      errors.push(`${label}: not a valid URL`)
      continue
    }
    if (url.protocol !== 'https:') errors.push(`${label}: must use https`)
    else if (!url.hostname) errors.push(`${label}: has no host`)
    else if (url.hostname === SITE_HOST) {
      const problem = validateSitePath(url, manifest, otherSiteUrls)
      if (problem) errors.push(`${label}: ${problem}`)
    }
  }
  return errors
}

// llmstxt.org only requires the H1. The rest is this project's convention: a blockquote summary,
// optional prose, then H2 sections holding nothing but `- [name](url): note` bullets.
function validateStructure(text) {
  const errors = []
  const lines = text.split('\n')
  const content = lines.filter(line => line.trim() !== '')
  if (!/^# \S/.test(content[0] ?? '')) errors.push('the first line must be the H1 title')
  if (!(content[1] ?? '').startsWith('> ')) errors.push('the H1 must be followed by a blockquote summary')
  let section = null
  for (const line of content.slice(1)) {
    if (line.startsWith('# ')) errors.push(`only one H1 is allowed: "${line}"`)
    else if (line.startsWith('## ')) section = line
    else if (section && !/^- \[[^\]]+\]\([^)\s]+\)(: .+)?$/.test(line)) {
      errors.push(`${section}: "${line}" is not a "- [name](url): note" link bullet`)
    }
  }
  return errors
}

function buildLlmsTxt({ template, links, manifest, otherSiteUrls }) {
  const text = fillTemplate(template, links)
  const errors = [...validateStructure(text), ...validateLinks(text, manifest, otherSiteUrls)]
  if (errors.length) throw new BuildError(`invalid llms.txt:\n  ${errors.join('\n  ')}`)
  return text
}

function parseArgs(argv) {
  const options = {
    template: 'scripts/llms.template.md',
    links: 'src/config/publicLinks.json',
    routes: 'dist/routes.json',
    out: 'dist/llms.txt'
  }
  for (let i = 0; i < argv.length; i += 2) {
    const name = argv[i].replace(/^--/, '')
    if (!(name in options) || argv[i + 1] === undefined) throw new BuildError(`unknown or incomplete option ${argv[i]}`)
    options[name] = argv[i + 1]
  }
  return options
}

function run(argv) {
  const options = parseArgs(argv)
  const readJson = path => JSON.parse(readFileSync(resolve(path), 'utf8'))
  const text = buildLlmsTxt({
    template: readFileSync(resolve(options.template), 'utf8'),
    links: readJson(options.links),
    manifest: readJson(options.routes)
  })
  mkdirSync(dirname(resolve(options.out)), { recursive: true })
  writeFileSync(resolve(options.out), text)
  process.stdout.write(`llms.txt: ${[...text.matchAll(MARKDOWN_LINK)].length} links validated, written to ${options.out}\n`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    run(process.argv.slice(2))
  } catch (error) {
    process.stderr.write(`build-llms-txt: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}

export { OTHER_SITE_URLS, buildLlmsTxt, fillTemplate, validateLinks, validateStructure }
