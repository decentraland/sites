import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

// The checker is an ESM script, which this CommonJS jest setup cannot import, so it runs in a child
// Node process. Every case goes through ONE child, and a crash fails loudly instead of surfacing as
// an empty-string mismatch.
const SCRIPT = join(__dirname, 'check-llms-links.mjs')

type Case = [url: string, status: number, contentType: string | null, body: string, finalUrl?: string]

function classifyAll(cases: Case[]): string[] {
  const code = `import { classify } from ${JSON.stringify(pathToFileURL(SCRIPT).href)}
const cases = JSON.parse(process.env.INPUT)
process.stdout.write(JSON.stringify(cases.map(([url, status, contentType, body, finalUrl]) => classify(url, finalUrl ?? url, status, contentType, body).result)))`
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], {
    encoding: 'utf8',
    env: { ...process.env, INPUT: JSON.stringify(cases) }
  })
  if (result.status !== 0) throw new Error(`classify child exited ${result.status}: ${result.stderr}`)
  return JSON.parse(result.stdout) as string[]
}

const CASES: Record<string, { input: Case; expected: string }> = {
  '403 is inconclusive': { input: ['https://decentraland.beehiiv.com/subscribe', 403, 'text/html', ''], expected: 'inconclusive' },
  '429 is inconclusive': { input: ['https://x.com/decentraland', 429, null, ''], expected: 'inconclusive' },
  'a 404 fails': { input: ['https://docs.decentraland.org/missing.md', 404, 'text/plain', ''], expected: 'fail' },
  'a text document answering an HTML shell fails': {
    input: ['https://docs.decentraland.org/apis/apis/events.md', 200, 'text/html; charset=utf-8', '<!DOCTYPE html>'],
    expected: 'fail'
  },
  'a text document served as text passes': {
    input: ['https://docs.decentraland.org/llms.txt', 200, 'text/plain', '# Decentraland'],
    expected: 'ok'
  },
  'a text document redirected to an HTML page answering 200 fails': {
    input: ['https://docs.decentraland.org/missing.md', 200, 'text/html', '<!doctype html>', 'https://docs.decentraland.org/404'],
    expected: 'fail'
  },
  'a text document with a non-text content type fails': {
    input: ['https://docs.decentraland.org/llms.txt', 200, 'application/octet-stream', '# Decentraland'],
    expected: 'fail'
  },
  'a text document redirected to another text document passes': {
    input: ['https://docs.decentraland.org/old.md', 200, 'text/markdown; charset=utf-8', '# Doc', 'https://docs.decentraland.org/new.md'],
    expected: 'ok'
  },
  'a link redirected to the site homepage fails': {
    input: ['https://decentraland.beehiiv.com/subscribe', 200, 'text/html', '<!doctype html>', 'https://decentraland.org/'],
    expected: 'fail'
  },
  'a link redirected within the site to a page passes': {
    input: ['https://dcl.gg/discord', 200, 'text/html', '<!doctype html>', 'https://decentraland.org/discord/'],
    expected: 'ok'
  },
  'an HTML page at a non-document URL passes': {
    input: ['https://x.com/decentraland', 200, 'text/html', '<!doctype html>'],
    expected: 'ok'
  }
}

describe('when classifying a link check response', () => {
  let results: Record<string, string>

  beforeAll(() => {
    const names = Object.keys(CASES)
    const outcomes = classifyAll(names.map(name => CASES[name].input))
    results = Object.fromEntries(names.map((name, index) => [name, outcomes[index]]))
  })

  it.each(Object.keys(CASES))('should classify correctly: %s', name => {
    expect(results[name]).toBe(CASES[name].expected)
  })
})

describe('when the checker is run with bad input', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'llms-links-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  const run = (args: string[]) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' })

  it('should reject an unknown option instead of ignoring it', () => {
    const result = run(['--nope', 'x'])
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('unknown or incomplete option --nope')
  })

  it('should reject a non-numeric timeout', () => {
    const result = run(['--timeout', 'soon'])
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('--timeout must be a positive number')
  })

  it('should report a malformed link as failed rather than crash', () => {
    const file = join(dir, 'llms.txt')
    writeFileSync(file, '- [Broken](not-a-url)\n')
    const result = run(['--file', file])
    expect(result.status).toBe(1)
    expect(result.stdout).toContain('not a valid URL')
    expect(result.stderr).toBe('')
  })
})
