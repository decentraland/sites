import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const SCRIPT = join(__dirname, 'check-llms-links.mjs')

const classify = (url: string, status: number, contentType: string | null, body: string) => {
  const code = `import { classify } from ${JSON.stringify(pathToFileURL(SCRIPT).href)}
const [url, status, contentType, body] = JSON.parse(process.env.INPUT)
process.stdout.write(classify(url, status, contentType, body).result)`
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], {
    encoding: 'utf8',
    env: { ...process.env, INPUT: JSON.stringify([url, status, contentType, body]) }
  })
  return result.stdout
}

describe('when classifying a link check response', () => {
  it('should treat 403 and 429 as inconclusive', () => {
    expect(classify('https://decentraland.beehiiv.com/subscribe', 403, 'text/html', '')).toBe('inconclusive')
    expect(classify('https://x.com/decentraland', 429, null, '')).toBe('inconclusive')
  })

  it('should fail a 404', () => {
    expect(classify('https://docs.decentraland.org/missing.md', 404, 'text/plain', '')).toBe('fail')
  })

  it('should fail a text document that answers with an HTML shell', () => {
    expect(classify('https://docs.decentraland.org/apis/apis/events.md', 200, 'text/html; charset=utf-8', '<!DOCTYPE html>')).toBe('fail')
  })

  it('should pass a text document served as text', () => {
    expect(classify('https://docs.decentraland.org/llms.txt', 200, 'text/plain', '# Decentraland')).toBe('ok')
  })

  it('should pass an HTML page at a non-document URL', () => {
    expect(classify('https://x.com/decentraland', 200, 'text/html', '<!doctype html>')).toBe('ok')
  })
})
