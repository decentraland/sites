#!/usr/bin/env node
// Live check of every external link in dist/llms.txt, plus the decentraland.org URLs served by other
// apps (OTHER_SITE_URLS in build-llms-txt.mjs). Not part of the build: it needs the network and third
// parties answer bots inconsistently. The remaining decentraland.org links are skipped because the
// build already validates them against this SPA's route manifest.
//
// 403 and 429 are reported as inconclusive, not as failures: beehiiv, for one, answers 403 to any
// non-browser client. Those need a manual check in a browser.
//
// Usage: node scripts/check-llms-links.mjs [--file dist/llms.txt] [--timeout 15000]

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { OTHER_SITE_URLS } from './build-llms-txt.mjs'

const MARKDOWN_LINK = /\[([^\]]*)\]\(([^)\s]+)\)/g
const SITE_HOST = 'decentraland.org'
const TEXT_DOCUMENT = /\.(md|txt)$/i

/**
 * `ok`, `inconclusive` or `fail` for one response. The document expectation comes from the REQUESTED
 * URL: a `.md`/`.txt` link must answer text/markdown or text/plain, even when a redirect moved it
 * somewhere else (a docs site redirecting a missing document to an HTML 404 page answers 200).
 */
function isSiteHomepage(url) {
  try {
    const { hostname, pathname } = new URL(url)
    return hostname === SITE_HOST && pathname === '/'
  } catch {
    return false
  }
}

function classify(requestedUrl, finalUrl, status, contentType, body) {
  const via = finalUrl && finalUrl !== requestedUrl ? ` via ${finalUrl}` : ''
  if (status === 403 || status === 429) return { result: 'inconclusive', reason: `HTTP ${status}${via}, check manually` }
  if (status < 200 || status >= 300) return { result: 'fail', reason: `HTTP ${status}${via}` }
  // A third-party link that ends on the site's own homepage is gone, not working: the beehiiv
  // subscribe page answered that way once, as a 200 that was not the newsletter.
  if (finalUrl && finalUrl !== requestedUrl && isSiteHomepage(finalUrl)) {
    return { result: 'fail', reason: `HTTP ${status}${via} landed on the homepage` }
  }
  if (TEXT_DOCUMENT.test(new URL(requestedUrl).pathname)) {
    const isText = /^text\/(markdown|plain)\b/i.test(contentType ?? '')
    const looksLikeHtml = /^\s*(<!doctype html|<html)/i.test(body)
    if (!isText || looksLikeHtml) {
      return { result: 'fail', reason: `HTTP ${status}${via} is ${contentType ?? 'untyped'}, not a text document` }
    }
  }
  return { result: 'ok', reason: `HTTP ${status}${via}` }
}

function hostOf(url) {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

/** The unique links in `text` that need a live check: everything the build cannot verify. */
function linksToCheck(text) {
  const urls = new Set([...text.matchAll(MARKDOWN_LINK)].map(([, , url]) => url))
  return [...urls].filter(url => hostOf(url) !== SITE_HOST || OTHER_SITE_URLS.has(url))
}

async function check(url, timeout) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(timeout),
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; decentraland-llms-link-check)' }
    })
    const body = (await response.text()).slice(0, 512)
    return classify(url, response.url || url, response.status, response.headers.get('content-type'), body)
  } catch (error) {
    return { result: 'fail', reason: error instanceof Error ? error.message : String(error) }
  }
}

async function run(argv) {
  const options = { file: 'dist/llms.txt', timeout: '15000' }
  for (let i = 0; i < argv.length; i += 2) {
    const name = argv[i].replace(/^--/, '')
    if (!(name in options) || argv[i + 1] === undefined) throw new Error(`unknown or incomplete option ${argv[i]}`)
    options[name] = argv[i + 1]
  }
  const timeout = Number(options.timeout)
  if (!Number.isFinite(timeout) || timeout <= 0) throw new Error(`--timeout must be a positive number, got ${options.timeout}`)
  const text = readFileSync(resolve(options.file), 'utf8')
  const urls = linksToCheck(text)

  // A malformed URL is a failed link, reported with the rest instead of aborting the run.
  const results = await Promise.all(
    urls.map(async url => ({ url, ...(hostOf(url) ? await check(url, timeout) : { result: 'fail', reason: 'not a valid URL' }) }))
  )
  for (const { url, result, reason } of results) process.stdout.write(`${result.padEnd(12)} ${reason.padEnd(24)} ${url}\n`)
  const failed = results.filter(({ result }) => result === 'fail').length
  const inconclusive = results.filter(({ result }) => result === 'inconclusive').length
  process.stdout.write(`\n${results.length} links checked: ${failed} failed, ${inconclusive} inconclusive\n`)
  return failed ? 1 : 0
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(process.argv.slice(2)).then(
    code => {
      process.exitCode = code
    },
    error => {
      process.stderr.write(`check-llms-links: ${error instanceof Error ? error.message : String(error)}\n`)
      process.exitCode = 1
    }
  )
}

export { classify, linksToCheck }
