import { describe, it, expect } from 'vitest'
import { validateEmail, validateEmailFormat, validatePassword, validateE164Phone } from './validators'

describe('validateEmail', () => {
  it('accepts a standard email', () => {
    expect(validateEmail('user@example.com')).toBe(true)
  })

  it('accepts email with subdomain', () => {
    expect(validateEmail('user@mail.example.co.uk')).toBe(true)
  })

  it('rejects missing @', () => {
    expect(validateEmail('userexample.com')).toBe(false)
  })

  it('rejects missing domain', () => {
    expect(validateEmail('user@')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(validateEmail('')).toBe(false)
  })

  it('rejects plain text', () => {
    expect(validateEmail('notanemail')).toBe(false)
  })
})

describe('validateEmailFormat (alias)', () => {
  it('is the same function as validateEmail', () => {
    expect(validateEmailFormat('a@b.com')).toBe(validateEmail('a@b.com'))
    expect(validateEmailFormat('bad')).toBe(validateEmail('bad'))
  })
})

describe('validatePassword', () => {
  it('accepts exactly 8 characters', () => {
    expect(validatePassword('12345678')).toBe(true)
  })

  it('accepts more than 8 characters', () => {
    expect(validatePassword('supersecretpassword')).toBe(true)
  })

  it('rejects 7 characters', () => {
    expect(validatePassword('1234567')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(validatePassword('')).toBe(false)
  })
})

describe('validateE164Phone', () => {
  it('accepts a valid US number', () => {
    expect(validateE164Phone('+12025551234')).toBe(true)
  })

  it('accepts a valid UK number', () => {
    expect(validateE164Phone('+447911123456')).toBe(true)
  })

  it('rejects number without leading +', () => {
    expect(validateE164Phone('12025551234')).toBe(false)
  })

  it('rejects number with spaces', () => {
    expect(validateE164Phone('+1 202 555 1234')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(validateE164Phone('')).toBe(false)
  })

  it('rejects + only', () => {
    expect(validateE164Phone('+')).toBe(false)
  })

  it('rejects number starting with +0', () => {
    expect(validateE164Phone('+0123456789')).toBe(false)
  })
})
