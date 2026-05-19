import { mapEnvToDclenv, mapHostnameToDclenv, resolveExplorerEnv } from './dclenv'

describe('dclenv', () => {
  describe('when mapEnvToDclenv is called', () => {
    describe.each([
      ['dev', 'zone'],
      ['stg', 'today'],
      ['prd', 'org'],
      ['prod', 'org']
    ])('and env is %s', (envValue, expected) => {
      it(`should return ${expected}`, () => {
        expect(mapEnvToDclenv(envValue)).toBe(expected)
      })
    })

    describe('and env is an unknown value', () => {
      it('should return undefined', () => {
        expect(mapEnvToDclenv('bogus')).toBeUndefined()
      })
    })

    describe.each([[null], [undefined], ['']])('and env is %p', envValue => {
      it('should return undefined', () => {
        expect(mapEnvToDclenv(envValue)).toBeUndefined()
      })
    })
  })

  describe('when mapHostnameToDclenv is called', () => {
    describe.each([
      ['decentraland.zone', 'zone'],
      ['play.decentraland.zone', 'zone'],
      ['sub.foo.decentraland.zone', 'zone'],
      ['decentraland.today', 'today'],
      ['play.decentraland.today', 'today']
    ])('and hostname is %s', (hostname, expected) => {
      it(`should return ${expected}`, () => {
        expect(mapHostnameToDclenv(hostname)).toBe(expected)
      })
    })

    describe.each([['decentraland.org'], ['play.decentraland.org'], ['localhost'], [''], ['evil-decentraland.zone.attacker.com']])(
      'and hostname is %p',
      hostname => {
        it('should return undefined', () => {
          expect(mapHostnameToDclenv(hostname)).toBeUndefined()
        })
      }
    )
  })

  describe('when resolveExplorerEnv is called', () => {
    describe('and ?dclenv is present', () => {
      it('should prefer it over ?env and hostname', () => {
        const params = new URLSearchParams('dclenv=today&env=prod')
        expect(resolveExplorerEnv(params, 'decentraland.zone')).toBe('today')
      })
    })

    describe('and only ?env is present', () => {
      it('should map env to dclenv', () => {
        const params = new URLSearchParams('env=prod')
        expect(resolveExplorerEnv(params, 'decentraland.zone')).toBe('org')
      })

      it('should map env=dev to zone even on a prod host', () => {
        const params = new URLSearchParams('env=dev')
        expect(resolveExplorerEnv(params, 'decentraland.org')).toBe('zone')
      })
    })

    describe('and no query is present', () => {
      it('should fall back to the hostname (zone)', () => {
        expect(resolveExplorerEnv(new URLSearchParams(''), 'decentraland.zone')).toBe('zone')
      })

      it('should fall back to the hostname (today)', () => {
        expect(resolveExplorerEnv(new URLSearchParams(''), 'decentraland.today')).toBe('today')
      })

      it('should return undefined on .org', () => {
        expect(resolveExplorerEnv(new URLSearchParams(''), 'decentraland.org')).toBeUndefined()
      })

      it('should return undefined on localhost', () => {
        expect(resolveExplorerEnv(new URLSearchParams(''), 'localhost')).toBeUndefined()
      })
    })

    describe('and ?env is an unknown value with no ?dclenv', () => {
      it('should fall back to the hostname', () => {
        const params = new URLSearchParams('env=bogus')
        expect(resolveExplorerEnv(params, 'decentraland.zone')).toBe('zone')
      })
    })

    describe('and the hostname is an empty string (SSR / no window)', () => {
      it('should return undefined when no query is present either', () => {
        expect(resolveExplorerEnv(new URLSearchParams(''), '')).toBeUndefined()
      })
    })
  })
})
