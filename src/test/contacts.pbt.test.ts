import * as fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { validateE164Phone, validateEmail } from '../utils/validators'
import type { EmergencyContact } from '../types'

// ─── Pure model functions ────────────────────────────────────────────────────

function addContact(
  contacts: EmergencyContact[],
  newContact: EmergencyContact
): EmergencyContact[] {
  return [...contacts, newContact]
}

function editContact(
  contacts: EmergencyContact[],
  id: string,
  updates: Partial<EmergencyContact>
): EmergencyContact[] {
  return contacts.map((c) => (c.id === id ? { ...c, ...updates } : c))
}

function removeContact(contacts: EmergencyContact[], id: string): EmergencyContact[] {
  return contacts.filter((c) => c.id !== id)
}

function addContactWithGuard(
  contacts: EmergencyContact[],
  newContact: EmergencyContact
): EmergencyContact[] {
  if (contacts.length >= 5) return contacts
  return [...contacts, newContact]
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const contactArb: fc.Arbitrary<EmergencyContact> = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  name: fc.string({ minLength: 1 }),
  phone: fc.constant('+12025551234'),
  email: fc.emailAddress(),
  createdAt: fc.constant(new Date()),
})

// ─── P16: Contact add round-trip ─────────────────────────────────────────────
// Feature: safetnet, Property 16: contact add round-trip
// Validates: Requirements 6.1

describe('P16: contact add round-trip', () => {
  it('adding a valid contact results in it appearing with all fields preserved', () => {
    fc.assert(
      fc.property(
        fc.array(contactArb, { minLength: 0, maxLength: 4 }),
        contactArb,
        (existing, newContact) => {
          const result = addContact(existing, newContact)
          const found = result.find((c) => c.id === newContact.id)
          expect(found).toBeDefined()
          expect(found?.name).toBe(newContact.name)
          expect(found?.phone).toBe(newContact.phone)
          expect(found?.email).toBe(newContact.email)
          expect(found?.userId).toBe(newContact.userId)
        }
      )
    )
  })
})

// ─── P17: Contact edit round-trip ────────────────────────────────────────────
// Feature: safetnet, Property 17: contact edit round-trip
// Validates: Requirements 6.2

describe('P17: contact edit round-trip', () => {
  it('editing a contact reflects the updated values exactly', () => {
    fc.assert(
      fc.property(
        fc.array(contactArb, { minLength: 1, maxLength: 5 }),
        fc.record({
          name: fc.string({ minLength: 1 }),
          phone: fc.constant('+12025551234'),
          email: fc.emailAddress(),
        }),
        (contacts, updates) => {
          const target = contacts[0]
          const result = editContact(contacts, target.id, updates)
          const edited = result.find((c) => c.id === target.id)
          expect(edited).toBeDefined()
          expect(edited?.name).toBe(updates.name)
          expect(edited?.phone).toBe(updates.phone)
          expect(edited?.email).toBe(updates.email)
          // Other contacts are unchanged
          const others = result.filter((c) => c.id !== target.id)
          const originalOthers = contacts.filter((c) => c.id !== target.id)
          expect(others).toEqual(originalOthers)
        }
      )
    )
  })
})

// ─── P18: Contact removal ─────────────────────────────────────────────────────
// Feature: safetnet, Property 18: contact removal
// Validates: Requirements 6.3

describe('P18: contact removal', () => {
  it('removing a contact means it no longer appears in the list', () => {
    fc.assert(
      fc.property(
        fc.array(contactArb, { minLength: 1, maxLength: 5 }),
        (contacts) => {
          const target = contacts[0]
          const result = removeContact(contacts, target.id)
          expect(result.find((c) => c.id === target.id)).toBeUndefined()
          expect(result.length).toBe(contacts.length - 1)
        }
      )
    )
  })
})

// ─── P19: Maximum contacts invariant ─────────────────────────────────────────
// Feature: safetnet, Property 19: maximum contacts invariant
// Validates: Requirements 6.4, 6.5

describe('P19: maximum contacts invariant', () => {
  it('contacts list never exceeds 5 regardless of how many adds are attempted', () => {
    fc.assert(
      fc.property(
        fc.array(contactArb, { minLength: 6, maxLength: 20 }),
        (contacts) => {
          // Simulate adding all contacts one by one starting from empty
          const result = contacts.reduce(
            (acc, contact) => addContactWithGuard(acc, contact),
            [] as EmergencyContact[]
          )
          expect(result.length).toBeLessThanOrEqual(5)
        }
      )
    )
  })

  it('addContactWithGuard returns contacts unchanged when already at 5', () => {
    fc.assert(
      fc.property(
        fc.array(contactArb, { minLength: 5, maxLength: 5 }),
        contactArb,
        (contacts, extra) => {
          const result = addContactWithGuard(contacts, extra)
          expect(result.length).toBe(5)
          expect(result).toEqual(contacts)
        }
      )
    )
  })
})

// ─── P20: Phone E.164 validation ─────────────────────────────────────────────
// Feature: safetnet, Property 20: phone E.164 validation
// Validates: Requirements 6.6

// Valid E.164 arbitrary: + followed by 1-9, then 1-13 more digits (total 2-15 digits after +)
const validE164Arb = fc
  .tuple(
    fc.integer({ min: 1, max: 9 }).map(String),
    fc.string({ minLength: 1, maxLength: 13, unit: 'binary-ascii' }).map((s) =>
      s.replace(/[^0-9]/g, '').slice(0, 13).padEnd(1, '0')
    )
  )
  .map(([first, rest]) => `+${first}${rest}`)
  .filter((s) => /^\+[1-9]\d{1,14}$/.test(s))

describe('P20: phone E.164 validation', () => {
  it('accepts a known valid E.164 number', () => {
    expect(validateE164Phone('+12025551234')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(validateE164Phone('')).toBe(false)
  })

  it('valid E.164 numbers are always accepted', () => {
    fc.assert(
      fc.property(validE164Arb, (phone) => {
        expect(validateE164Phone(phone)).toBe(true)
      })
    )
  })

  it('strings not matching E.164 pattern are rejected', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !/^\+[1-9]\d{1,14}$/.test(s)),
        (phone) => {
          expect(validateE164Phone(phone)).toBe(false)
        }
      )
    )
  })
})

// ─── P21: Email format validation ────────────────────────────────────────────
// Feature: safetnet, Property 21: email format validation
// Validates: Requirements 6.7

describe('P21: email format validation', () => {
  it('valid email addresses are always accepted', () => {
    fc.assert(
      fc.property(fc.emailAddress(), (email) => {
        expect(validateEmail(email)).toBe(true)
      })
    )
  })

  it('strings without @ are always rejected', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !s.includes('@')),
        (s) => {
          expect(validateEmail(s)).toBe(false)
        }
      )
    )
  })
})
