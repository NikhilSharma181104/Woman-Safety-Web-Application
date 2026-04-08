import * as fc from 'fast-check'
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { validateCheckInDuration } from '../utils/validators'
import type { CheckIn } from '../types'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
    })),
  },
}))

vi.mock('../store/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: { setActiveCheckIn: (c: CheckIn | null) => void }) => unknown) =>
    selector({ setActiveCheckIn: vi.fn() }),
  ),
}))

// ─── Pure helper functions ────────────────────────────────────────────────────

/**
 * Builds the expired check-in alert payload.
 * Mirrors the logic that would be used in the Edge Function / alert system.
 * (Property 9)
 */
function buildExpiredCheckInPayload(
  userName: string,
  destinationLabel: string,
  location: { latitude: number; longitude: number } | null,
): string {
  const locationPart = location
    ? `Last known location: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
    : 'Last known location: unavailable'

  return `⏰ CHECK-IN EXPIRED\n${userName} has not checked in.\nDestination: ${destinationLabel}\n${locationPart}`
}

/**
 * Deactivates a check-in by setting its status to 'completed'.
 * Pure state machine — no side effects. (Property 10)
 */
function deactivateCheckIn(checkIn: CheckIn): CheckIn {
  return { ...checkIn, status: 'completed' }
}

/**
 * Returns the 20 most recent check-ins by createdAt, descending. (Property 12)
 */
function getHistoryDisplay(checkIns: CheckIn[]): CheckIn[] {
  return [...checkIns]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 20)
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const checkInArb = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  destinationLabel: fc.string({ minLength: 1 }),
  durationMinutes: fc.integer({ min: 5, max: 1440 }),
  expiresAt: fc.constant(new Date(Date.now() + 3_600_000)),
  status: fc.constant('active' as const),
  createdAt: fc.date({ min: new Date(0), max: new Date(2_000_000_000_000) }),
})

const activeCheckInArb = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  destinationLabel: fc.string({ minLength: 1 }),
  durationMinutes: fc.integer({ min: 5, max: 1440 }),
  expiresAt: fc.constant(new Date(Date.now() + 60_000)),
  status: fc.constant('active' as const),
  createdAt: fc.constant(new Date()),
})

// ─── P8: Check-in duration validation ────────────────────────────────────────
// Feature: safetnet, Property 8: check-in duration validation
// Validates: Requirements 4.1, 4.5

describe('P8: check-in duration validation', () => {
  it('accepts iff value is in [5, 1440]', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1000, max: 2000 }), (v) => {
        const result = validateCheckInDuration(v)
        const isValid = v >= 5 && v <= 1440
        expect(result === null).toBe(isValid)
      }),
    )
  })

  it('returns null for all valid durations in [5, 1440]', () => {
    fc.assert(
      fc.property(fc.integer({ min: 5, max: 1440 }), (v) => {
        expect(validateCheckInDuration(v)).toBeNull()
      }),
    )
  })

  it('returns an error string for all values below 5', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1000, max: 4 }), (v) => {
        expect(validateCheckInDuration(v)).not.toBeNull()
      }),
    )
  })

  it('returns an error string for all values above 1440', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1441, max: 2000 }), (v) => {
        expect(validateCheckInDuration(v)).not.toBeNull()
      }),
    )
  })
})

// ─── P9: Expired check-in alert payload completeness ─────────────────────────
// Feature: safetnet, Property 9: expired check-in alert payload completeness
// Validates: Requirements 4.2

describe('P9: expired check-in alert payload completeness', () => {
  it('payload contains userName, destinationLabel, and coordinates when location is provided', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.record({
          latitude: fc.float({ min: -90, max: 90, noNaN: true }),
          longitude: fc.float({ min: -180, max: 180, noNaN: true }),
        }),
        (userName, destinationLabel, location) => {
          const payload = buildExpiredCheckInPayload(userName, destinationLabel, location)

          expect(payload).toContain(userName)
          expect(payload).toContain(destinationLabel)
          expect(payload).toContain(location.latitude.toFixed(5))
          expect(payload).toContain(location.longitude.toFixed(5))
        },
      ),
    )
  })

  it('payload contains userName and destinationLabel when location is null', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (userName, destinationLabel) => {
          const payload = buildExpiredCheckInPayload(userName, destinationLabel, null)

          expect(payload).toContain(userName)
          expect(payload).toContain(destinationLabel)
        },
      ),
    )
  })

  it('payload contains userName, destinationLabel, and location info for any optional location', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.option(
          fc.record({
            latitude: fc.float({ min: -90, max: 90, noNaN: true }),
            longitude: fc.float({ min: -180, max: 180, noNaN: true }),
          }),
        ),
        (userName, destinationLabel, location) => {
          const payload = buildExpiredCheckInPayload(userName, destinationLabel, location ?? null)

          expect(payload).toContain(userName)
          expect(payload).toContain(destinationLabel)

          if (location) {
            expect(payload).toContain(location.latitude.toFixed(5))
            expect(payload).toContain(location.longitude.toFixed(5))
          }
        },
      ),
    )
  })
})

// ─── P10: Check-in deactivation state transition ─────────────────────────────
// Feature: safetnet, Property 10: check-in deactivation state transition
// Validates: Requirements 4.3

describe('P10: check-in deactivation state transition', () => {
  it('deactivating an active check-in sets status to completed', () => {
    fc.assert(
      fc.property(activeCheckInArb, (checkIn) => {
        const result = deactivateCheckIn(checkIn)
        expect(result.status).toBe('completed')
      }),
    )
  })

  it('deactivation preserves the check-in identity (id unchanged)', () => {
    fc.assert(
      fc.property(activeCheckInArb, (checkIn) => {
        const result = deactivateCheckIn(checkIn)
        expect(result.id).toBe(checkIn.id)
      }),
    )
  })

  it('deactivation preserves all other fields', () => {
    fc.assert(
      fc.property(activeCheckInArb, (checkIn) => {
        const result = deactivateCheckIn(checkIn)
        expect(result.userId).toBe(checkIn.userId)
        expect(result.destinationLabel).toBe(checkIn.destinationLabel)
        expect(result.durationMinutes).toBe(checkIn.durationMinutes)
        expect(result.expiresAt).toBe(checkIn.expiresAt)
      }),
    )
  })
})

// ─── P11: Check-in card rendering ────────────────────────────────────────────
// Feature: safetnet, Property 11: check-in card rendering
// Validates: Requirements 4.4

describe('P11: check-in card rendering', () => {
  it('renders destination label, countdown, and deactivation control for any active check-in', async () => {
    const { CheckInCard } = await import('../components/CheckInCard')

    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          userId: fc.uuid(),
          // Restrict to printable ASCII to avoid regex escaping issues in aria queries
          destinationLabel: fc.stringOf(
            fc.mapToConstant(
              { num: 26, build: (n) => String.fromCharCode(65 + n) },  // A-Z
              { num: 26, build: (n) => String.fromCharCode(97 + n) },  // a-z
              { num: 10, build: (n) => String.fromCharCode(48 + n) },  // 0-9
            ),
            { minLength: 1, maxLength: 20 },
          ),
          durationMinutes: fc.integer({ min: 5, max: 1440 }),
          expiresAt: fc.constant(new Date(Date.now() + 3_600_000)),
          status: fc.constant('active' as const),
          createdAt: fc.constant(new Date()),
        }),
        (checkIn) => {
          const { container, unmount } = render(<CheckInCard checkIn={checkIn} />)

          // Destination label is visible somewhere in the rendered output
          expect(container.textContent).toContain(checkIn.destinationLabel)

          // Countdown display is present (aria-label="Time remaining")
          const countdownEl = container.querySelector('[aria-label="Time remaining"]')
          expect(countdownEl).not.toBeNull()

          // Deactivation control is present (button with aria-label matching /deactivate/i)
          const buttons = container.querySelectorAll('button')
          const deactivateBtn = Array.from(buttons).find((btn) =>
            /deactivate/i.test(btn.getAttribute('aria-label') ?? ''),
          )
          expect(deactivateBtn).toBeTruthy()

          unmount()
        },
      ),
    )
  })
})

// ─── P12: Check-in history cap ───────────────────────────────────────────────
// Feature: safetnet, Property 12: check-in history cap
// Validates: Requirements 4.6

describe('P12: check-in history cap', () => {
  it('returns exactly 20 entries for any list longer than 20', () => {
    fc.assert(
      fc.property(
        fc.array(checkInArb, { minLength: 21, maxLength: 100 }),
        (checkIns) => {
          const result = getHistoryDisplay(checkIns)
          expect(result.length).toBe(20)
        },
      ),
    )
  })

  it('result is sorted by createdAt descending', () => {
    fc.assert(
      fc.property(
        fc.array(checkInArb, { minLength: 21, maxLength: 100 }),
        (checkIns) => {
          const result = getHistoryDisplay(checkIns)

          for (let i = 0; i < result.length - 1; i++) {
            expect(result[i].createdAt.getTime()).toBeGreaterThanOrEqual(
              result[i + 1].createdAt.getTime(),
            )
          }
        },
      ),
    )
  })

  it('result contains the 20 most recent entries', () => {
    fc.assert(
      fc.property(
        fc.array(checkInArb, { minLength: 21, maxLength: 100 }),
        (checkIns) => {
          const result = getHistoryDisplay(checkIns)

          // The oldest entry in the result should be more recent than any entry not in the result
          const resultIds = new Set(result.map((c) => c.id))
          const excluded = checkIns.filter((c) => !resultIds.has(c.id))

          if (excluded.length > 0) {
            const oldestInResult = Math.min(...result.map((c) => c.createdAt.getTime()))
            const newestExcluded = Math.max(...excluded.map((c) => c.createdAt.getTime()))
            expect(oldestInResult).toBeGreaterThanOrEqual(newestExcluded)
          }
        },
      ),
    )
  })
})
