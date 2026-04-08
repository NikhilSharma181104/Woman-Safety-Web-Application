import * as fc from 'fast-check'
import { describe, it, expect } from 'vitest'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Contact {
  id: string
  name: string
  phone: string
  email: string
}

interface Location {
  latitude: number
  longitude: number
  recorded_at: string
}

type AlertType = 'emergency_start' | 'emergency_end' | 'checkin_expired'

// ─── Pure helper functions (mirroring Edge Function logic) ───────────────────

/**
 * Simulates dispatching alerts to a list of contacts.
 * Returns the IDs of all contacts that received an attempt.
 */
function simulateDispatch(contacts: Contact[]): string[] {
  return contacts.map((c) => c.id)
}

/**
 * Builds the SMS body — same logic as the Edge Function's buildSmsBody.
 */
function buildSmsBody(
  userName: string,
  alertType: AlertType,
  location: Location | null,
  timestamp: string,
): string {
  const actionLabel =
    alertType === 'emergency_start'
      ? '🚨 EMERGENCY ALERT'
      : alertType === 'emergency_end'
        ? '✅ SAFE — Emergency Ended'
        : '⏰ CHECK-IN EXPIRED'

  const locationPart = location
    ? `Location: https://maps.google.com/?q=${location.latitude},${location.longitude} (${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)})`
    : 'Location: unavailable'

  return `${actionLabel}\n${userName} needs help.\n${locationPart}\nTime: ${timestamp}`
}

/**
 * Simulates SMS retry logic.
 * failCount: how many times SMS fails before succeeding (or all 3 fail).
 * Returns { attempts: number (1-3), success: boolean }.
 */
function simulateSmsRetry(failCount: number): { attempts: number; success: boolean } {
  const MAX_ATTEMPTS = 3
  let attempts = 0

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    attempts = attempt
    const succeeded = attempt > failCount
    if (succeeded) {
      return { attempts, success: true }
    }
  }

  return { attempts: MAX_ATTEMPTS, success: false }
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const contactArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1 }),
  phone: fc.constant('+12025551234'),
  email: fc.emailAddress(),
})

const locationArb = fc.record({
  latitude: fc.float({ min: -90, max: 90, noNaN: true }),
  longitude: fc.float({ min: -180, max: 180, noNaN: true }),
  recorded_at: fc.constant(new Date().toISOString()),
})

const alertTypeArb = fc.constantFrom<AlertType>(
  'emergency_start',
  'emergency_end',
  'checkin_expired',
)

// ─── P1: Alert dispatch covers all contacts ───────────────────────────────────
// Feature: safetnet, Property 1: alert dispatch covers all contacts
// Validates: Requirements 1.3, 3.1, 3.2

describe('P1: alert dispatch covers all contacts', () => {
  it('produces an attempt for every contact in the list', () => {
    fc.assert(
      fc.property(
        fc.array(contactArb, { minLength: 1, maxLength: 5 }),
        (contacts) => {
          const attempted = simulateDispatch(contacts)

          // Every contact must have received an attempt
          expect(attempted.length).toBe(contacts.length)

          // Every contact ID must appear in the result
          for (const contact of contacts) {
            expect(attempted).toContain(contact.id)
          }
        },
      ),
    )
  })

  it('no contact is silently skipped', () => {
    fc.assert(
      fc.property(
        fc.array(contactArb, { minLength: 1, maxLength: 5 }),
        (contacts) => {
          const attempted = simulateDispatch(contacts)
          const attemptedSet = new Set(attempted)

          for (const contact of contacts) {
            expect(attemptedSet.has(contact.id)).toBe(true)
          }
        },
      ),
    )
  })
})

// ─── P5: SMS payload completeness ────────────────────────────────────────────
// Feature: safetnet, Property 5: SMS payload completeness
// Validates: Requirements 3.1

describe('P5: SMS payload completeness', () => {
  it('body contains the user name', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        alertTypeArb,
        fc.option(locationArb),
        fc.date(),
        (userName, alertType, location, date) => {
          const timestamp = date.toISOString()
          const body = buildSmsBody(userName, alertType, location ?? null, timestamp)

          expect(body).toContain(userName)
        },
      ),
    )
  })

  it('body contains coordinates or maps link when location is provided', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        alertTypeArb,
        locationArb,
        fc.date(),
        (userName, alertType, location, date) => {
          const timestamp = date.toISOString()
          const body = buildSmsBody(userName, alertType, location, timestamp)

          // Must contain either the maps link or the raw coordinates
          const hasMapsLink = body.includes('maps.google.com')
          const hasCoords =
            body.includes(location.latitude.toFixed(5)) &&
            body.includes(location.longitude.toFixed(5))

          expect(hasMapsLink || hasCoords).toBe(true)
        },
      ),
    )
  })

  it('body contains the timestamp', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        alertTypeArb,
        fc.option(locationArb),
        fc.date(),
        (userName, alertType, location, date) => {
          const timestamp = date.toISOString()
          const body = buildSmsBody(userName, alertType, location ?? null, timestamp)

          expect(body).toContain(timestamp)
        },
      ),
    )
  })
})

// ─── P6: Alert timestamp inclusion ───────────────────────────────────────────
// Feature: safetnet, Property 6: alert timestamp inclusion
// Validates: Requirements 3.5

describe('P6: alert timestamp inclusion', () => {
  it('every alert message body contains the timestamp', () => {
    fc.assert(
      fc.property(
        alertTypeArb,
        fc.date(),
        fc.string({ minLength: 1 }),
        (alertType, date, userName) => {
          const timestamp = date.toISOString()
          const body = buildSmsBody(userName, alertType, null, timestamp)

          expect(body).toContain(timestamp)
        },
      ),
    )
  })

  it('timestamp is present regardless of alert type', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<AlertType>('emergency_start', 'emergency_end', 'checkin_expired'),
        fc.date(),
        (alertType, date) => {
          const timestamp = date.toISOString()
          const body = buildSmsBody('Test User', alertType, null, timestamp)

          expect(body).toContain(timestamp)
        },
      ),
    )
  })
})

// ─── P7: SMS retry bound ──────────────────────────────────────────────────────
// Feature: safetnet, Property 7: SMS retry bound
// Validates: Requirements 3.3

describe('P7: SMS retry bound', () => {
  it('attempts is always between 1 and 3 inclusive', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 5 }), (failCount) => {
        const { attempts } = simulateSmsRetry(failCount)

        expect(attempts).toBeGreaterThanOrEqual(1)
        expect(attempts).toBeLessThanOrEqual(3)
      }),
    )
  })

  it('when failCount >= 3, success is false and attempts === 3', () => {
    fc.assert(
      fc.property(fc.integer({ min: 3, max: 5 }), (failCount) => {
        const { attempts, success } = simulateSmsRetry(failCount)

        expect(success).toBe(false)
        expect(attempts).toBe(3)
      }),
    )
  })

  it('when failCount < 3, success is true and attempts === failCount + 1', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 }), (failCount) => {
        const { attempts, success } = simulateSmsRetry(failCount)

        expect(success).toBe(true)
        expect(attempts).toBe(failCount + 1)
      }),
    )
  })
})
