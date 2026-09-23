import type { Profile } from 'dcl-catalyst-client/dist/client/specs/lambdas-client'
import { getInviterName } from './invite.helpers'

const profileWith = (name: unknown): Profile => ({ avatars: [{ name }] }) as unknown as Profile

describe('when reading the inviter name from a profile', () => {
  it('should return the avatar name', () => {
    expect(getInviterName(profileWith('SirTesla'))).toBe('SirTesla')
  })

  it('should trim surrounding whitespace', () => {
    expect(getInviterName(profileWith('  SirTesla  '))).toBe('SirTesla')
  })

  it('should return null for a whitespace-only or empty name', () => {
    expect(getInviterName(profileWith('   '))).toBeNull()
    expect(getInviterName(profileWith(''))).toBeNull()
  })

  it('should return null when the avatar has no name', () => {
    expect(getInviterName(profileWith(undefined))).toBeNull()
  })

  it('should return null when the profile has no avatars', () => {
    expect(getInviterName({ avatars: [] } as unknown as Profile)).toBeNull()
  })

  it('should return null when there is no profile', () => {
    expect(getInviterName(null)).toBeNull()
    expect(getInviterName(undefined)).toBeNull()
  })
})
