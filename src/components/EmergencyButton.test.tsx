import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmergencyButton } from './EmergencyButton'

// Mock framer-motion to avoid animation complexity in tests
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: React.ComponentPropsWithRef<'button'>) => (
      <button {...props}>{children}</button>
    ),
    span: ({ children, ...props }: React.ComponentPropsWithRef<'span'>) => (
      <span {...props}>{children}</span>
    ),
    div: ({ children, ...props }: React.ComponentPropsWithRef<'div'>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Ensure the portal target exists before each test
beforeEach(() => {
  let portalEl = document.getElementById('emergency-portal')
  if (!portalEl) {
    portalEl = document.createElement('div')
    portalEl.id = 'emergency-portal'
    document.body.appendChild(portalEl)
  }
})

function renderButton(props: Partial<React.ComponentProps<typeof EmergencyButton>> = {}) {
  const defaults = {
    isActive: false,
    onActivate: vi.fn(),
    onDeactivate: vi.fn(),
    onEmptyContacts: vi.fn(),
    hasNoContacts: false,
  }
  return render(<EmergencyButton {...defaults} {...props} />)
}

describe('EmergencyButton — ARIA states', () => {
  it('idle: aria-pressed="false" and aria-label="Activate emergency"', () => {
    renderButton({ isActive: false })
    const btn = screen.getByRole('button', { name: 'Activate emergency' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    expect(btn).toHaveAttribute('aria-label', 'Activate emergency')
  })

  it('active: aria-pressed="true" and aria-label="Deactivate emergency"', () => {
    renderButton({ isActive: true })
    const btn = screen.getByRole('button', { name: 'Deactivate emergency' })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    expect(btn).toHaveAttribute('aria-label', 'Deactivate emergency')
  })
})

describe('EmergencyButton — visual states', () => {
  it('active: button has coral background (#FF6B6B)', () => {
    renderButton({ isActive: true })
    const btn = screen.getByRole('button', { name: 'Deactivate emergency' })
    expect(btn).toHaveStyle({ backgroundColor: '#FF6B6B' })
  })

  it('idle: button has navy background (#1a2744)', () => {
    renderButton({ isActive: false })
    const btn = screen.getByRole('button', { name: 'Activate emergency' })
    expect(btn).toHaveStyle({ backgroundColor: '#1a2744' })
  })
})

describe('EmergencyButton — click handlers', () => {
  it('empty-contacts guard: calls onEmptyContacts instead of onActivate', async () => {
    const onActivate = vi.fn()
    const onEmptyContacts = vi.fn()
    renderButton({ hasNoContacts: true, isActive: false, onActivate, onEmptyContacts })

    await userEvent.click(screen.getByRole('button', { name: 'Activate emergency' }))

    expect(onEmptyContacts).toHaveBeenCalledOnce()
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('normal activation: calls onActivate when contacts exist', async () => {
    const onActivate = vi.fn()
    renderButton({ hasNoContacts: false, isActive: false, onActivate })

    await userEvent.click(screen.getByRole('button', { name: 'Activate emergency' }))

    expect(onActivate).toHaveBeenCalledOnce()
  })

  it('deactivation: calls onDeactivate when active', async () => {
    const onDeactivate = vi.fn()
    renderButton({ isActive: true, onDeactivate })

    await userEvent.click(screen.getByRole('button', { name: 'Deactivate emergency' }))

    expect(onDeactivate).toHaveBeenCalledOnce()
  })
})

describe('EmergencyButton — keyboard activation', () => {
  it('Enter key calls the correct handler (activate)', async () => {
    const onActivate = vi.fn()
    renderButton({ isActive: false, onActivate })

    const btn = screen.getByRole('button', { name: 'Activate emergency' })
    btn.focus()
    await userEvent.keyboard('{Enter}')

    expect(onActivate).toHaveBeenCalledOnce()
  })

  it('Space key calls the correct handler (activate)', async () => {
    const onActivate = vi.fn()
    renderButton({ isActive: false, onActivate })

    const btn = screen.getByRole('button', { name: 'Activate emergency' })
    btn.focus()
    await userEvent.keyboard(' ')

    expect(onActivate).toHaveBeenCalledOnce()
  })

  it('Enter key calls onDeactivate when active', async () => {
    const onDeactivate = vi.fn()
    renderButton({ isActive: true, onDeactivate })

    const btn = screen.getByRole('button', { name: 'Deactivate emergency' })
    btn.focus()
    await userEvent.keyboard('{Enter}')

    expect(onDeactivate).toHaveBeenCalledOnce()
  })

  it('Space key calls onDeactivate when active', async () => {
    const onDeactivate = vi.fn()
    renderButton({ isActive: true, onDeactivate })

    const btn = screen.getByRole('button', { name: 'Deactivate emergency' })
    btn.focus()
    await userEvent.keyboard(' ')

    expect(onDeactivate).toHaveBeenCalledOnce()
  })
})
