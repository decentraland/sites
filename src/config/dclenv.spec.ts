import { mapEnvToDclenv, normalizeDclenv } from './dclenv'

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

  describe('when normalizeDclenv is called', () => {
    describe.each([['zone'], ['today'], ['org']])('and dclenv is %s', dclenv => {
      it('should return it unchanged', () => {
        expect(normalizeDclenv(dclenv)).toBe(dclenv)
      })
    })

    // The value reaches the native client through the `decentraland://` deep
    // link, and ui2 forwards whatever it is handed, so anything off the known
    // set has to be dropped here.
    describe.each([['bogus'], ['prod'], ['dev'], ['https://evil.test'], ['zone ']])('and dclenv is %p', dclenv => {
      it('should return undefined', () => {
        expect(normalizeDclenv(dclenv)).toBeUndefined()
      })
    })

    describe.each([[null], [undefined], ['']])('and dclenv is %p', dclenv => {
      it('should return undefined', () => {
        expect(normalizeDclenv(dclenv)).toBeUndefined()
      })
    })
  })
})
