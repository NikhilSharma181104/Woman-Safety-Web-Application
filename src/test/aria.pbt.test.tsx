// Feature: safetnet, Property 23: ARIA label coverage
// Validates: Requirements 9.1
//
// For any interactive element rendered by the app (button, input, link, select),
// it should have a non-empty aria-label, aria-labelledby, or an associated <label> element.

import * as fc from 'fast-check'
import { describe, it, expect, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { configureAxe, toHaveNoViolations } from 'jest-axe'
import type { EmergencyContact, CheckIn } from '../types'

// ─── jest-axe setup ──────────────────────────────────────────────────────────

expect.extend(toHaveNoViolations)

const axe = configureAxe({
  rules: {
    // Disable color-contrast rule — requires visual rendering; covered by 10.3 docs
    'color-contrast': { enabled: false },
    // Disable region rule — components are rendered in isolation without page landmarks
    region: { enabled: false },
  },
})

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => ({ data: null, error: { message: 'mock' } })) })) })),
      update: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
      upsert: vi.fn(() => ({ error: null })),
    })),
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
  },
}))

vi.mock('../store/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({
      session: { user: { id: 'test-user-id' } },
      contacts: [],
      setActiveCheckIn: vi.fn(),
      setContacts: vi.fn(),
    }),
  ),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns all interactive elements (buttons, inputs, selects, textareas, links)
 * within a container.
 */
function getInteractiveElements(container: HTMLElement): Element[] {
  return Array.from(
    container.querySelectorAll('button, input, select, textarea, a[href]'),
  )
}

/**
 * Checks whether an element has an accessible name via:
 * - aria-label attribute (non-empty)
 * - aria-labelledby attribute pointing to an existing element with text
 * - an associated <label> element (via htmlFor / id pairing, or wrapping label)
 * - visible text content for buttons/links
 */
function hasAccessibleName(el: Element, container: HTMLElement): boolean {
  // 1. aria-label
  const ariaLabel = el.getAttribute('aria-label')
  if (ariaLabel && ariaLabel.trim().length > 0) return true

  // 2. aria-labelledby
  const labelledBy = el.getAttribute('aria-labelledby')
  if (labelledBy) {
    const ids = labelledBy.split(/\s+/)
    const hasText = ids.some((id) => {
      const ref = container.querySelector(`#${CSS.escape(id)}`)
      return ref && (ref.textContent ?? '').trim().length > 0
    })
    if (hasText) return true
  }

  // 3. Associated <label> via id
  const id = el.getAttribute('id')
  if (id) {
    const label = container.querySelector(`label[for="${CSS.escape(id)}"]`)
    if (label && (label.textContent ?? '').trim().length > 0) return true
  }

  // 4. Wrapping <label>
  if (el.closest('label')) return true

  // 5. Visible text content (for buttons and links)
  const tag = el.tagName.toLowerCase()
  if (tag === 'button' || tag === 'a') {
    const text = (el.textContent ?? '').trim()
    if (text.length > 0) return true
  }

  return false
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const checkInArb: fc.Arbitrary<CheckIn> = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  destinationLabel: fc.string({ minLength: 1, maxLength: 30 }),
  durationMinutes: fc.integer({ min: 5, max: 1440 }),
  expiresAt: fc.constant(new Date(Date.now() + 3_600_000)),
  status: fc.constant('active' as const),
  createdAt: fc.constant(new Date()),
})

// ─── P23: ARIA label coverage — EmergencyButton ──────────────────────────────

describe('P23: ARIA label coverage — EmergencyButton', () => {
  it('all buttons in EmergencyButton have accessible names for any isActive state', async () => {
    const { EmergencyButton } = await import('../components/EmergencyButton')

    fc.assert(
      fc.property(fc.boolean(), (isActive) => {
        // EmergencyButton uses a React portal — render into body and query from body
        const wrapper = document.createElement('div')
        document.body.appendChild(wrapper)

        // Ensure portal target exists
        const portalEl = document.createElement('div')
        portalEl.id = 'emergency-portal'
        document.body.appendChild(portalEl)

        const { unmount } = render(
          <EmergencyButton
            isActive={isActive}
            onActivate={vi.fn()}
            onDeactivate={vi.fn()}
          />,
          { container: wrapper },
        )

        // Portal renders into portalEl — query buttons from there
        const buttons = Array.from(portalEl.querySelectorAll('button'))
        for (const btn of buttons) {
          expect(hasAccessibleName(btn, portalEl)).toBe(true)
        }

        unmount()
        document.body.removeChild(wrapper)
        document.body.removeChild(portalEl)
      }),
    )
  })
})

// ─── P23: ARIA label coverage — AddContactForm ───────────────────────────────

describe('P23: ARIA label coverage — AddContactForm', () => {
  it('all inputs and buttons have accessible names', async () => {
    const { AddContactForm } = await import('../components/AddContactForm')

    fc.assert(
      fc.property(fc.boolean(), (_atLimit) => {
        const { container, unmount } = render(
          <AddContactForm onAdded={vi.fn()} />,
        )

        const interactive = getInteractiveElements(container)
        for (const el of interactive) {
          expect(hasAccessibleName(el, container)).toBe(true)
        }

        unmount()
        cleanup()
      }),
    )
  })
})

// ─── P23: ARIA label coverage — CheckInForm ──────────────────────────────────

describe('P23: ARIA label coverage — CheckInForm', () => {
  it('all inputs and buttons have accessible names', async () => {
    const { CheckInForm } = await import('../components/CheckInForm')

    fc.assert(
      fc.property(fc.constant(null), () => {
        const { container, unmount } = render(<CheckInForm />)

        const interactive = getInteractiveElements(container)
        for (const el of interactive) {
          expect(hasAccessibleName(el, container)).toBe(true)
        }

        unmount()
        cleanup()
      }),
    )
  })
})

// ─── P23: ARIA label coverage — ProfileSettingsForm ──────────────────────────

describe('P23: ARIA label coverage — ProfileSettingsForm', () => {
  it('all inputs and buttons have accessible names', async () => {
    const { ProfileSettingsForm } = await import('../components/ProfileSettingsForm')

    fc.assert(
      fc.property(fc.constant(null), () => {
        const { container, unmount } = render(<ProfileSettingsForm />)

        const interactive = getInteractiveElements(container)
        for (const el of interactive) {
          expect(hasAccessibleName(el, container)).toBe(true)
        }

        unmount()
        cleanup()
      }),
    )
  })
})

// ─── P23: ARIA label coverage — CheckInCard ──────────────────────────────────

describe('P23: ARIA label coverage — CheckInCard', () => {
  it('all buttons have accessible names for any active check-in', async () => {
    const { CheckInCard } = await import('../components/CheckInCard')

    fc.assert(
      fc.property(checkInArb, (checkIn) => {
        const { container, unmount } = render(<CheckInCard checkIn={checkIn} />)

        const buttons = Array.from(container.querySelectorAll('button'))
        for (const btn of buttons) {
          expect(hasAccessibleName(btn, container)).toBe(true)
        }

        unmount()
        cleanup()
      }),
    )
  })
})

// ─── 10.5: axe-core audit — zero critical violations ─────────────────────────

describe('axe-core audit: zero critical violations', () => {
  it('AddContactForm has no critical axe violations', async () => {
    const { AddContactForm } = await import('../components/AddContactForm')
    const { container } = render(<AddContactForm onAdded={vi.fn()} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
    cleanup()
  })

  it('CheckInForm has no critical axe violations', async () => {
    const { CheckInForm } = await import('../components/CheckInForm')
    const { container } = render(<CheckInForm />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
    cleanup()
  })

  it('ProfileSettingsForm has no critical axe violations', async () => {
    const { ProfileSettingsForm } = await import('../components/ProfileSettingsForm')
    const { container } = render(<ProfileSettingsForm />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
    cleanup()
  })

  it('CheckInCard has no critical axe violations', async () => {
    const { CheckInCard } = await import('../components/CheckInCard')
    const checkIn: CheckIn = {
      id: 'test-id',
      userId: 'user-id',
      destinationLabel: 'Coffee shop',
      durationMinutes: 60,
      expiresAt: new Date(Date.now() + 3_600_000),
      status: 'active',
      createdAt: new Date(),
    }
    const { container } = render(<CheckInCard checkIn={checkIn} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
    cleanup()
  })

  it('ContactCard has no critical axe violations', async () => {
    const { ContactCard } = await import('../components/ContactCard')
    const contact: EmergencyContact = {
      id: 'contact-id',
      userId: 'user-id',
      name: 'Jane Doe',
      phone: '+12125551234',
      email: 'jane@example.com',
      createdAt: new Date(),
    }
    const { container } = render(
      <ContactCard contact={contact} onUpdate={vi.fn()} onRemove={vi.fn()} />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
    cleanup()
  })
})
