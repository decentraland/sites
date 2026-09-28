#!/usr/bin/env node
// Live check of every external link in dist/llms.txt. Not part of the build: it needs the network
// and third parties answer bots inconsistently. decentraland.org links are skipped because the build
// already validates them against the route manifest.
//
// 403 and 429 are reported as inconclusive, not as failures: beehiiv, for one, answers 403 to any
// non-browser client. Those need a manual check in a browser.
//
// Usage: node scripts/check-llms-links.mjs [--file dist/llms.txt] [--timeout 15000]

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const MARKDOWN_LINK = /\[([^\]]*)\]\(([^)\s]+)\)/g
const SITE_HOST = 'decentraland.org'
const TEXT_DOCUMENT = /\.(md|txt)$/i

/**
 * `ok`, `inconclusive` or `fail` for one response. The document expectation comes from the REQUESTED
 * URL: a `.md`/`.txt` link must answer text/markdown or text/plain, even when a redirect moved it
 * somewhere else (a docs site redirecting a missing document to an HTML 404 page answers 200).
 */
function classify(requestedUrl, finalUrl, status, contentType, body) {
  const via = finalUrl && finalUrl !== requestedUrl ? ` via ${finalUrl}` : ''
  if (status === 403 || status === 429) return { result: 'inconclusive', reason: `HTTP ${status}${via}, check manually` }
  if (status < 200 || status >= 300) return { result: 'fail', reason: `HTTP ${status}${via}` }
  if (TEXT_DOCUMENT.test(new URL(requestedUrl).pathname)) {
    const isText = /^text\/(markdown|plain)\b/i.test(contentType ?? '')
    const looksLikeHtml = /^\s*(<!doctype html|<html)/i.test(body)
    if (!isText || looksLikeHtml) {
      return { result: 'fail', reason: `HTTP ${status}${via} is ${contentType ?? 'untyped'}, not a text document` }
    }
  }
  return { result: 'ok', reason: `HTTP ${status}${via}` }
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
  for (let i = 0; i < argv.length; i += 2) options[argv[i].replace(/^--/, '')] = argv[i + 1]
  const text = readFileSync(resolve(options.file), 'utf8')
  const urls = [...new Set([...text.matchAll(MARKDOWN_LINK)].map(([, , url]) => url))].filter(url => new URL(url).hostname !== SITE_HOST)

  const results = await Promise.all(urls.map(async url => ({ url, ...(await check(url, Number(options.timeout))) })))
  for (const { url, result, reason } of results) process.stdout.write(`${result.padEnd(12)} ${reason.padEnd(24)} ${url}\n`)
  const failed = results.filter(({ result }) => result === 'fail').length
  const inconclusive = results.filter(({ result }) => result === 'inconclusive').length
  process.stdout.write(`\n${results.length} external links: ${failed} failed, ${inconclusive} inconclusive\n`)
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

export { classify }
