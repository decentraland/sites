import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const SCRIPT = join(__dirname, 'check-i18n.mjs')

type Files = Record<string, string>

const runCheck = (dir: string, extraArgs: string[] = []) => {
  const result = spawnSync(process.execPath, [SCRIPT, '--dir', dir, ...extraArgs], { encoding: 'utf8' })
  return { status: result.status, stdout: result.stdout, stderr: result.stderr }
}

const writeLocales = (dir: string, files: Files) => {
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(dir, name), content)
  }
}

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`

describe('when running the i18n check', () => {
  let dir: string
  let source: Record<string, unknown>

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'check-i18n-'))
    source = { page: { home: { title: 'Home', cta: 'Go' } }, nav: { back: 'Back' } }
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
    jest.resetAllMocks()
  })

  describe('and every locale mirrors the source keys', () => {
    beforeEach(() => {
      writeLocales(dir, { 'en.json': json(source), 'es.json': json(source), 'fr.json': json(source) })
    })

    it('should exit 0 and report that it matches the baseline', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(0)
      expect(result.stdout).toContain('OK: matches baseline')
    })

    it('should ignore positional arguments appended by lint-staged', () => {
      const result = runCheck(dir, [join(dir, 'es.json'), join(dir, 'fr.json')])
      expect(result.status).toBe(0)
    })
  })

  describe('and a locale misses a key that is not in the baseline', () => {
    beforeEach(() => {
      writeLocales(dir, {
        'en.json': json(source),
        'es.json': json({ page: { home: { title: 'Inicio' } }, nav: { back: 'Volver' } })
      })
    })

    it('should exit 1 and name the locale and the missing key path', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('es.json missing: page.home.cta')
    })
  })

  describe('and a locale has a key the source does not have', () => {
    beforeEach(() => {
      writeLocales(dir, { 'en.json': json(source), 'es.json': json({ ...source, legacy: { old: 'x' } }) })
    })

    it('should exit 1 and report the key as extra', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('es.json extra: legacy.old')
    })
  })

  describe('and a locale has an object where the source has a string', () => {
    beforeEach(() => {
      writeLocales(dir, { 'en.json': json(source), 'es.json': json({ ...source, nav: { back: { label: 'Volver' } } }) })
    })

    it('should report the source key as missing and the nested key as extra', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('es.json missing: nav.back')
      expect(result.stdout).toContain('es.json extra: nav.back.label')
    })
  })

  describe('and a locale has a number where the source has a string', () => {
    beforeEach(() => {
      writeLocales(dir, { 'en.json': json(source), 'es.json': json({ ...source, nav: { back: 3 } }) })
    })

    it('should report the key as a type mismatch', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('es.json mismatch: nav.back')
    })
  })

  describe('and the baseline already lists the missing key', () => {
    beforeEach(() => {
      writeLocales(dir, {
        'en.json': json(source),
        'es.json': json({ page: { home: { title: 'Inicio' } }, nav: { back: 'Volver' } }),
        'parity-baseline.json': json({ es: { missing: ['page.home.cta'] } })
      })
    })

    it('should exit 0 because the debt is known', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(0)
      expect(result.stdout).toContain('missing 1 (baseline 1)')
    })
  })

  describe('and the baseline lists a key that is no longer missing', () => {
    beforeEach(() => {
      writeLocales(dir, {
        'en.json': json(source),
        'es.json': json(source),
        'parity-baseline.json': json({ es: { missing: ['page.home.cta'] } })
      })
    })

    it('should exit 1 and ask to prune the resolved entry', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('RESOLVED')
      expect(result.stdout).toContain('es.json missing: page.home.cta')
    })
  })

  describe('and one baselined key was fixed while a different key went missing', () => {
    beforeEach(() => {
      writeLocales(dir, {
        'en.json': json(source),
        'es.json': json({ page: { home: { title: 'Inicio', cta: 'Ir' } }, nav: {} }),
        'parity-baseline.json': json({ es: { missing: ['page.home.cta'] } })
      })
    })

    it('should fail because baselines compare exact key sets, not counts', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('NEW (not in baseline):')
      expect(result.stdout).toContain('es.json missing: nav.back')
      expect(result.stdout).toContain('FAIL: 1 new, 1 resolved')
    })
  })

  describe('and a locale file repeats a top-level member', () => {
    beforeEach(() => {
      writeLocales(dir, { 'en.json': json(source), 'es.json': '{\n  "nav": { "back": "a" },\n  "nav": { "back": "b" }\n}\n' })
    })

    it('should exit 1 and report the duplicate with its line and column', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('es.json: duplicate key "nav" at 3:3')
    })
  })

  describe('and a locale file repeats a nested member', () => {
    beforeEach(() => {
      writeLocales(dir, {
        'en.json': json(source),
        'es.json': '{\n  "page": { "home": { "title": "a", "title": "b", "cta": "c" } },\n  "nav": { "back": "d" }\n}\n'
      })
    })

    it('should report the duplicate with its full key path', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('duplicate key "page.home.title"')
    })
  })

  describe('and the same member name appears in two different objects', () => {
    beforeEach(() => {
      const locale = { page: { title: 'x' }, nav: { title: 'y' } }
      writeLocales(dir, { 'en.json': json(locale), 'es.json': json(locale) })
    })

    it('should not report a duplicate', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(0)
      expect(result.stdout).not.toContain('duplicate')
    })
  })

  describe('and a member name is repeated through a unicode escape', () => {
    beforeEach(() => {
      writeLocales(dir, { 'en.json': json(source), 'es.json': '{ "a": 1, "\\u0061": 2 }\n' })
    })

    it('should treat the escaped spelling as the same key', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('duplicate key "a"')
    })
  })

  describe('and the source file itself has a duplicate member', () => {
    beforeEach(() => {
      writeLocales(dir, { 'en.json': '{ "a": "x", "a": "y" }\n', 'es.json': json({ a: 'z' }) })
    })

    it('should fail and skip the parity comparison', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('en.json: duplicate key "a"')
      expect(result.stdout).toContain('parity skipped')
    })
  })

  describe('and a locale file contains a comment', () => {
    beforeEach(() => {
      writeLocales(dir, { 'en.json': json(source), 'es.json': '{\n  // not allowed\n  "a": 1\n}\n' })
    })

    it('should reject it as invalid strict JSON', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('es.json: InvalidCommentToken at 2:3')
    })
  })

  describe('and a locale file has a trailing comma', () => {
    beforeEach(() => {
      writeLocales(dir, { 'en.json': json(source), 'es.json': '{ "a": 1, }\n' })
    })

    it('should reject it as invalid strict JSON', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toMatch(/es\.json: (PropertyNameExpected|ValueExpected) at 1:\d+/)
    })
  })

  describe('and a locale file is malformed', () => {
    beforeEach(() => {
      writeLocales(dir, { 'en.json': json(source), 'es.json': '{ "a": "unterminated\n' })
    })

    it('should report the syntax error with a position instead of crashing', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toMatch(/es\.json: \w+ at \d+:\d+/)
    })
  })

  describe('and a locale file is an array instead of an object', () => {
    beforeEach(() => {
      writeLocales(dir, { 'en.json': json(source), 'es.json': '["a"]\n' })
    })

    it('should reject it because locale roots must be objects', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(1)
      expect(result.stdout).toContain('es.json: RootMustBeObject')
    })
  })

  describe('and --write-baseline is passed with outstanding parity debt', () => {
    beforeEach(() => {
      writeLocales(dir, {
        'en.json': json(source),
        'es.json': json({ page: { home: { title: 'Inicio' } }, nav: { back: 'Volver' } })
      })
    })

    it('should write a sorted baseline that makes the next run pass', () => {
      const write = runCheck(dir, ['--write-baseline'])
      expect(write.status).toBe(0)
      const baseline = JSON.parse(readFileSync(join(dir, 'parity-baseline.json'), 'utf8'))
      expect(baseline.es).toEqual({ missing: ['page.home.cta'] })
      expect(runCheck(dir).status).toBe(0)
    })

    it('should not baseline structural errors', () => {
      writeFileSync(join(dir, 'fr.json'), '{ "a": 1, "a": 2 }\n')
      const write = runCheck(dir, ['--write-baseline'])
      expect(write.status).toBe(1)
      expect(write.stdout).toContain('fr.json: duplicate key "a"')
    })

    it('should leave an existing baseline untouched when a locale fails to parse', () => {
      const existing = json({ es: { missing: ['page.home.cta'] } })
      writeFileSync(join(dir, 'parity-baseline.json'), existing)
      writeFileSync(join(dir, 'fr.json'), '{ "a": 1, "a": 2 }\n')

      const write = runCheck(dir, ['--write-baseline'])

      expect(write.status).toBe(1)
      expect(readFileSync(join(dir, 'parity-baseline.json'), 'utf8')).toBe(existing)
    })
  })

  describe('and --write-baseline is passed with no debt', () => {
    beforeEach(() => {
      writeLocales(dir, { 'en.json': json(source), 'es.json': json(source) })
    })

    it('should write a baseline that only carries the comment', () => {
      expect(runCheck(dir, ['--write-baseline']).status).toBe(0)
      const baseline = JSON.parse(readFileSync(join(dir, 'parity-baseline.json'), 'utf8'))
      expect(Object.keys(baseline)).toEqual(['$comment'])
    })
  })

  describe('and the source locale file does not exist', () => {
    beforeEach(() => {
      writeLocales(dir, { 'es.json': json(source) })
    })

    it('should exit 2 with a usage error', () => {
      const result = runCheck(dir)
      expect(result.status).toBe(2)
      expect(result.stderr).toContain('source locale en.json not found')
      expect(existsSync(join(dir, 'parity-baseline.json'))).toBe(false)
    })
  })

  describe('and an unknown option is passed', () => {
    beforeEach(() => {
      writeLocales(dir, { 'en.json': json(source) })
    })

    it('should exit 2 and name the option', () => {
      const result = runCheck(dir, ['--bogus'])
      expect(result.status).toBe(2)
      expect(result.stderr).toContain('unknown option --bogus')
    })
  })
})
