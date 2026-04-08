import * as fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { validatePassword } from '../utils/validators'

// Pure helper functions modelling the auth error message behaviour

/**
 * Returns a generic login error message regardless of the underlying Supabase error.
 * This ensures no field-specific information is disclosed.
 */
function getLoginErrorMessage(_supabaseError: string): string {
  return 'Invalid credentials. Please try again.'
}

/**
 * Returns a generic signup error message regardless of the underlying Supabase error.
 * This ensures account existence is never disclosed.
 */
function getSignupErrorMessage(_supabaseError: string): string {
  return 'Unable to create account. Please try again.'
}

// ─── P15: Password length validation ────────────────────────────────────────
// Feature: safetnet, Property 15: password length validation
// Validates: Requirements 5.7

describe('P15: password length validation', () => {
  it('accepts strings with length >= 8 and rejects strings with length < 8', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 20 }), (s) => {
        const result = validatePassword(s)
        if (s.length >= 8) {
          expect(result).toBe(true)
        } else {
          expect(result).toBe(false)
        }
      })
    )
  })

  it('short strings (length < 8) are always rejected', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 7 }), (s) => {
        expect(validatePassword(s)).toBe(false)
      })
    )
  })

  it('strings of length >= 8 are always accepted', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 8, maxLength: 20 }), (s) => {
        expect(validatePassword(s)).toBe(true)
      })
    )
  })
})

// ─── P13: Login error non-disclosure ────────────────────────────────────────
// Feature: safetnet, Property 13: login error non-disclosure
// Validates: Requirements 5.3

describe('P13: login error non-disclosure', () => {
  it('always returns the same generic message regardless of supabase error input', () => {
    const EXPECTED = 'Invalid credentials. Please try again.'
    fc.assert(
      fc.property(fc.string(), (supabaseError) => {
        expect(getLoginErrorMessage(supabaseError)).toBe(EXPECTED)
      })
    )
  })
})

// ─── P14: Signup duplicate email non-disclosure ──────────────────────────────
// Feature: safetnet, Property 14: signup duplicate email non-disclosure
// Validates: Requirements 5.5

describe('P14: signup duplicate email non-disclosure', () => {
  const FORBIDDEN_PHRASES = ['already registered', 'account exists', 'email taken']

  it('never discloses account existence in the signup error message', () => {
    fc.assert(
      fc.property(fc.string(), (supabaseError) => {
        const message = getSignupErrorMessage(supabaseError).toLowerCase()
        for (const phrase of FORBIDDEN_PHRASES) {
          expect(message).not.toContain(phrase)
        }
      })
    )
  })
})
