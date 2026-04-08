import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ResetPasswordPage from './ResetPasswordPage'

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn(),
    },
  },
}))

import { supabase } from '../lib/supabase'

const mockResetPassword = supabase.auth.resetPasswordForEmail as ReturnType<typeof vi.fn>

function renderPage() {
  return render(
    <MemoryRouter>
      <ResetPasswordPage />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ResetPasswordPage', () => {
  it('renders the email field, submit button, and back to login link', () => {
    renderPage()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument()
  })

  it('shows inline error for invalid email format without calling supabase', async () => {
    renderPage()
    await userEvent.type(screen.getByLabelText(/email address/i), 'notanemail')
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument()
    expect(mockResetPassword).not.toHaveBeenCalled()
  })

  it('calls supabase.auth.resetPasswordForEmail with correct args on valid submit', async () => {
    mockResetPassword.mockResolvedValue({ error: null })
    renderPage()
    await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com')
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('user@example.com', {
        redirectTo: window.location.origin + '/update-password',
      })
    })
  })

  it('shows confirmation message on success — does not confirm account existence (Requirement 5.4)', async () => {
    mockResetPassword.mockResolvedValue({ error: null })
    renderPage()
    await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com')
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    const confirmation = await screen.findByText(
      /if an account exists for that email, a reset link has been sent/i
    )
    expect(confirmation).toBeInTheDocument()

    // Must not confirm account existence
    expect(screen.queryByText(/account found/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/we found your account/i)).not.toBeInTheDocument()
  })

  it('shows generic error message on supabase failure', async () => {
    mockResetPassword.mockResolvedValue({ error: { message: 'Internal server error' } })
    renderPage()
    await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com')
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    const errorMsg = await screen.findByText(/something went wrong/i)
    expect(errorMsg).toBeInTheDocument()

    // Raw supabase error must not be surfaced
    expect(screen.queryByText(/internal server error/i)).not.toBeInTheDocument()
  })

  it('back to login link points to /login', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login')
  })
})
