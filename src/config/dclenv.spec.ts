import { mapEnvToDclenv } from './dclenv'

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
})
