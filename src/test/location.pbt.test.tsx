import * as fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { EmergencyStatusBanner } from '../components/EmergencyStatusBanner'
import type { LocationState } from '../types'

// ─── P3: Location transmission lifecycle ─────────────────────────────────────
// Feature: safetnet, Property 3: location transmission lifecycle
// Validates: Requirements 2.1, 2.2

/**
 * Pure function modelling the write-gate logic inside useLocationService.
 * Returns true only when emergency mode is active AND enough time has elapsed
 * since the last write (≥ 30 000 ms).
 */
function shouldWriteLocation(
  lastWriteTime: number,
  currentTime: number,
  active: boolean,
): boolean {
  if (!active) return false
  return currentTime - lastWriteTime >= 30_000
}

describe('P3: location transmission lifecycle', () => {
  it('never writes when emergency mode is inactive', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (lastWriteTime, currentTime) => {
          expect(shouldWriteLocation(lastWriteTime, currentTime, false)).toBe(false)
        },
      ),
    )
  })

  it('does not write when active but interval < 30 000 ms', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 1, max: 29_999 }),
        (lastWriteTime, delta) => {
          const currentTime = lastWriteTime + delta
          expect(shouldWriteLocation(lastWriteTime, currentTime, true)).toBe(false)
        },
      ),
    )
  })

  it('writes when active and interval >= 30 000 ms', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 30_000, max: 200_000 }),
        (lastWriteTime, delta) => {
          const currentTime = lastWriteTime + delta
          expect(shouldWriteLocation(lastWriteTime, currentTime, true)).toBe(true)
        },
      ),
    )
  })

  it('active flag is the sole gate when timing is irrelevant', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.boolean(),
        (lastWriteTime, currentTime, active) => {
          const result = shouldWriteLocation(lastWriteTime, currentTime, active)
          if (!active) {
            expect(result).toBe(false)
          } else {
            const interval = currentTime - lastWriteTime
            expect(result).toBe(interval >= 30_000)
          }
        },
      ),
    )
  })
})

// ─── P4: Location status display ─────────────────────────────────────────────
// Feature: safetnet, Property 4: location status display
// Validates: Requirements 2.4

describe('P4: location status display', () => {
  it('shows timestamp when permissionStatus is not denied and lastTransmittedAt is non-null', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date(0), max: new Date(2_000_000_000_000) }),
        fc.constantFrom('granted', 'prompt', 'unknown') as fc.Arbitrary<
          'granted' | 'prompt' | 'unknown'
        >,
        (lastTransmittedAt, permissionStatus) => {
          const locationState: LocationState = {
            coords: null,
            permissionStatus,
            lastTransmittedAt,
            error: null,
          }

          const { getByText } = render(
            <EmergencyStatusBanner locationState={locationState} />,
          )

          // The banner should render the time string produced by toLocaleTimeString()
          const expectedTime = lastTransmittedAt.toLocaleTimeString()
          expect(getByText(expectedTime)).toBeTruthy()

          cleanup()
        },
      ),
    )
  })

  it('shows "Location sharing unavailable" when permissionStatus is denied', () => {
    fc.assert(
      fc.property(
        fc.option(fc.date({ min: new Date(0), max: new Date(2_000_000_000_000) })),
        (lastTransmittedAt) => {
          const locationState: LocationState = {
            coords: null,
            permissionStatus: 'denied',
            lastTransmittedAt: lastTransmittedAt ?? null,
            error: null,
          }

          const { getByText } = render(
            <EmergencyStatusBanner locationState={locationState} />,
          )

          expect(getByText('Location sharing unavailable')).toBeTruthy()

          cleanup()
        },
      ),
    )
  })
})
